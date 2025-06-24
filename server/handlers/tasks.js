const url = require('url');
const { getTasks, addTask, findTask, deleteTask } = require('../lib/store');
const { sendJson, parseBody } = require('../lib/utils');

function list(req, res, user) {
  const query = url.parse(req.url, true).query;
  let tasks = getTasks(user.id).slice();
  if (query.status) tasks = tasks.filter(t => t.status === query.status);
  if (query.priority) tasks = tasks.filter(t => t.priority === query.priority);
  if (query.sortBy) {
    const order = query.order === 'desc' ? -1 : 1;
    tasks.sort((a, b) => {
      if (query.sortBy === 'dueDate')
        return ((a.dueDate || '') > (b.dueDate || '') ? 1 : -1) * order;
      if (query.sortBy === 'priority') return (a.priority > b.priority ? 1 : -1) * order;
      if (query.sortBy === 'createdAt') return (a.createdAt - b.createdAt) * order;
      return 0;
    });
  }
  sendJson(res, 200, tasks);
}

function create(req, res, user) {
  parseBody(req)
    .then(({ title, description, dueDate, priority, status }) => {
      if (!title || typeof title !== 'string') {
        return sendJson(res, 400, { error: 'title required' });
      }
      const task = addTask(user.id, { title, description, dueDate, priority, status });
      sendJson(res, 201, task);
    })
    .catch(() => sendJson(res, 400, { error: 'invalid json' }));
}

function get(req, res, user, id) {
  const task = findTask(user.id, id);
  if (!task) return sendJson(res, 404, { error: 'not found' });
  sendJson(res, 200, task);
}

function update(req, res, user, id) {
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

function patchStatus(req, res, user, id) {
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

function remove(req, res, user, id) {
  const ok = deleteTask(user.id, id);
  if (!ok) return sendJson(res, 404, { error: 'not found' });
  sendJson(res, 204, {});
}

module.exports = {
  list,
  create,
  get,
  update,
  patchStatus,
  remove
};
