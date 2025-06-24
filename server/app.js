const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const { register, login } = require('./handlers/auth');
const tasks = require('./handlers/tasks');
const { authenticate } = require('./lib/auth');
const { sendJson } = require('./lib/utils');

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
  if (req.method === 'POST' && parsed.pathname === '/api/register') return register(req, res);
  if (req.method === 'POST' && parsed.pathname === '/api/login') return login(req, res);

  if (parsed.pathname.startsWith('/api/tasks')) {
    const user = authenticate(req);
    if (!user) return sendJson(res, 401, { error: 'unauthorized' });

    const idMatch = parsed.pathname.match(/^\/api\/tasks\/(\d+)(?:\/status)?$/);
    if (req.method === 'POST' && parsed.pathname === '/api/tasks') return tasks.create(req, res, user);
    if (req.method === 'GET' && parsed.pathname === '/api/tasks') return tasks.list(req, res, user);
    if (req.method === 'GET' && idMatch) return tasks.get(req, res, user, idMatch[1]);
    if (req.method === 'PUT' && idMatch) return tasks.update(req, res, user, idMatch[1]);
    if (req.method === 'PATCH' && parsed.pathname.endsWith('/status') && idMatch) return tasks.patchStatus(req, res, user, idMatch[1]);
    if (req.method === 'DELETE' && idMatch) return tasks.remove(req, res, user, idMatch[1]);
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
