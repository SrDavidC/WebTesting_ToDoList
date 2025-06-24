const http = require('http');
const url = require('url');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SECRET = 'supersecret';

const users = {}; // username -> {id, passwordHash}
const tasksByUser = {}; // userId -> [tasks]

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1e6) req.connection.destroy();
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

function base64url(input) {
  return Buffer.from(JSON.stringify(input)).toString('base64url');
}

function signToken(payload) {
  const header = base64url({ alg: 'HS256', typ: 'JWT' });
  const body = base64url(payload);
  const signature = crypto.createHmac('sha256', SECRET)
    .update(header + '.' + body)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expected = crypto.createHmac('sha256', SECRET)
    .update(header + '.' + body)
    .digest('base64url');
  if (expected !== signature) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch (e) {
    return null;
  }
}

function authenticate(req) {
  const auth = req.headers['authorization'];
  if (!auth) return null;
  const token = auth.split(' ')[1];
  return verifyToken(token);
}

let taskIdCounter = 1;

function handleRegister(req, res) {
  parseBody(req)
    .then(({ username, password }) => {
      if (!username || !password) {
        return sendJson(res, 400, { error: 'username and password required' });
      }
      if (users[username]) {
        return sendJson(res, 400, { error: 'user exists' });
      }
      const id = crypto.randomUUID();
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      users[username] = { id, passwordHash };
      tasksByUser[id] = [];
      const token = signToken({ id, username });
      sendJson(res, 201, { token });
    })
    .catch(() => sendJson(res, 400, { error: 'invalid json' }));
}

function handleLogin(req, res) {
  parseBody(req)
    .then(({ username, password }) => {
      if (!username || !password) {
        return sendJson(res, 400, { error: 'username and password required' });
      }
      const user = users[username];
      if (!user) return sendJson(res, 401, { error: 'invalid credentials' });
      const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
      if (user.passwordHash !== passwordHash) {
        return sendJson(res, 401, { error: 'invalid credentials' });
      }
      const token = signToken({ id: user.id, username });
      sendJson(res, 200, { token });
    })
    .catch(() => sendJson(res, 400, { error: 'invalid json' }));
}

function getTasks(userId) {
  return tasksByUser[userId] || [];
}

function handleCreateTask(req, res, user) {
  parseBody(req)
    .then(({ title, description, dueDate, priority, status }) => {
      if (!title || typeof title !== 'string') {
        return sendJson(res, 400, { error: 'title required' });
      }
      const task = {
        id: taskIdCounter++,
        title,
        description: description || '',
        dueDate: dueDate || null,
        priority: priority || 'Low',
        status: status || 'pending',
        createdAt: Date.now()
      };
      getTasks(user.id).push(task);
      sendJson(res, 201, task);
    })
    .catch(() => sendJson(res, 400, { error: 'invalid json' }));
}

function handleListTasks(req, res, user) {
  const query = url.parse(req.url, true).query;
  let tasks = getTasks(user.id).slice();
  if (query.status) tasks = tasks.filter(t => t.status === query.status);
  if (query.priority) tasks = tasks.filter(t => t.priority === query.priority);
  if (query.sortBy) {
    const order = query.order === 'desc' ? -1 : 1;
    tasks.sort((a, b) => {
      if (query.sortBy === 'dueDate') return ((a.dueDate || '') > (b.dueDate || '') ? 1 : -1) * order;
      if (query.sortBy === 'priority') return (a.priority > b.priority ? 1 : -1) * order;
      if (query.sortBy === 'createdAt') return (a.createdAt - b.createdAt) * order;
      return 0;
    });
  }
  sendJson(res, 200, tasks);
}

function findTask(userId, id) {
  return getTasks(userId).find(t => String(t.id) === String(id));
}

function handleGetTask(req, res, user, id) {
  const task = findTask(user.id, id);
  if (!task) return sendJson(res, 404, { error: 'not found' });
  sendJson(res, 200, task);
}

function handleUpdateTask(req, res, user, id) {
  const task = findTask(user.id, id);
  if (!task) return sendJson(res, 404, { error: 'not found' });
  parseBody(req)
    .then(({ title, description, dueDate, priority, status }) => {
      if (title !== undefined) {
        if (!title || typeof title !== 'string') {
          return sendJson(res, 400, { error: 'title required' });
        }
        task.title = title;
      }
      if (description !== undefined) task.description = description;
      if (dueDate !== undefined) task.dueDate = dueDate;
      if (priority !== undefined) task.priority = priority;
      if (status !== undefined) task.status = status;
      sendJson(res, 200, task);
    })
    .catch(() => sendJson(res, 400, { error: 'invalid json' }));
}

function handlePatchStatus(req, res, user, id) {
  const task = findTask(user.id, id);
  if (!task) return sendJson(res, 404, { error: 'not found' });
  parseBody(req)
    .then(({ status }) => {
      if (!status) return sendJson(res, 400, { error: 'status required' });
      task.status = status;
      sendJson(res, 200, task);
    })
    .catch(() => sendJson(res, 400, { error: 'invalid json' }));
}

function handleDeleteTask(req, res, user, id) {
  const tasks = getTasks(user.id);
  const index = tasks.findIndex(t => String(t.id) === String(id));
  if (index === -1) return sendJson(res, 404, { error: 'not found' });
  tasks.splice(index, 1);
  sendJson(res, 204, {});
}

function serveStatic(req, res) {
  const filePath = path.join(__dirname, '..', 'public', req.url === '/' ? 'index.html' : req.url);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not Found');
    }
    const ext = path.extname(filePath);
    const type = ext === '.js' ? 'application/javascript' : ext === '.css' ? 'text/css' : 'text/html';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  if (req.method === 'POST' && parsed.pathname === '/api/register') return handleRegister(req, res);
  if (req.method === 'POST' && parsed.pathname === '/api/login') return handleLogin(req, res);

  if (parsed.pathname.startsWith('/api/tasks')) {
    const user = authenticate(req);
    if (!user) return sendJson(res, 401, { error: 'unauthorized' });

    const idMatch = parsed.pathname.match(/^\/api\/tasks\/(\d+)(?:\/status)?$/);
    if (req.method === 'POST' && parsed.pathname === '/api/tasks') return handleCreateTask(req, res, user);
    if (req.method === 'GET' && parsed.pathname === '/api/tasks') return handleListTasks(req, res, user);
    if (req.method === 'GET' && idMatch) return handleGetTask(req, res, user, idMatch[1]);
    if (req.method === 'PUT' && idMatch) return handleUpdateTask(req, res, user, idMatch[1]);
    if (req.method === 'PATCH' && parsed.pathname.endsWith('/status') && idMatch) return handlePatchStatus(req, res, user, idMatch[1]);
    if (req.method === 'DELETE' && idMatch) return handleDeleteTask(req, res, user, idMatch[1]);
    return sendJson(res, 404, { error: 'not found' });
  }

  if (req.method === 'GET') return serveStatic(req, res);
  res.writeHead(404);
  res.end('Not Found');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
