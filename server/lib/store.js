const crypto = require('crypto');

const users = {}; // username -> {id, passwordHash}
const tasksByUser = {}; // userId -> [tasks]
let taskIdCounter = 1;

function createUser(username, password) {
  const id = crypto.randomUUID();
  const passwordHash = crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
  users[username] = { id, passwordHash };
  tasksByUser[id] = [];
  return { id };
}

function verifyUser(username, password) {
  const user = users[username];
  if (!user) return null;
  const passwordHash = crypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
  if (user.passwordHash !== passwordHash) return null;
  return { id: user.id };
}

function getTasks(userId) {
  return tasksByUser[userId] || [];
}

function addTask(userId, data) {
  const task = {
    id: taskIdCounter++,
    title: data.title,
    description: data.description || '',
    dueDate: data.dueDate || null,
    priority: data.priority || 'Low',
    status: data.status || 'pending',
    createdAt: Date.now()
  };
  getTasks(userId).push(task);
  return task;
}

function findTask(userId, id) {
  return getTasks(userId).find(t => String(t.id) === String(id));
}

function deleteTask(userId, id) {
  const tasks = getTasks(userId);
  const index = tasks.findIndex(t => String(t.id) === String(id));
  if (index === -1) return false;
  tasks.splice(index, 1);
  return true;
}

module.exports = {
  createUser,
  verifyUser,
  getTasks,
  addTask,
  findTask,
  deleteTask
};
