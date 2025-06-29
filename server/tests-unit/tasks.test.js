const tasks = require('../handlers/tasks');
const store = require('../lib/store');
const utils = require('../lib/utils');

jest.mock('../lib/store');
jest.mock('../lib/utils');

describe('tasks handlers', () => {
  let user, res;

  beforeEach(() => {
    user = { id: 'user1' };
    res = {};
    utils.sendJson.mockClear();
    utils.parseBody.mockClear();
  });

  describe('list', () => {
    it('returns all tasks for user', () => {
      store.getTasks.mockReturnValue([{ id: 1 }, { id: 2 }]);
      const req = { url: '/tasks' };
      tasks.list(req, res, user);
      expect(utils.sendJson).toHaveBeenCalledWith(res, 200, [{ id: 1 }, { id: 2 }]);
    });

    it('filters by status and priority', () => {
      store.getTasks.mockReturnValue([
        { id: 1, status: 'done', priority: '1' },
        { id: 2, status: 'todo', priority: '2' }
      ]);
      const req = { url: '/tasks?status=done&priority=1' };
      tasks.list(req, res, user);
      expect(utils.sendJson).toHaveBeenCalledWith(res, 200, [{ id: 1, status: 'done', priority: '1' }]);
    });

    it('sorts by dueDate asc', () => {
      store.getTasks.mockReturnValue([
        { id: 1, dueDate: '2024-01-01' },
        { id: 2, dueDate: '2024-01-02' }
      ]);
      const req = { url: '/tasks?sortBy=dueDate' };
      tasks.list(req, res, user);
      expect(utils.sendJson).toHaveBeenCalledWith(res, 200, [
        { id: 1, dueDate: '2024-01-01' },
        { id: 2, dueDate: '2024-01-02' }
      ]);
    });

    it('sorts by priority desc', () => {
      store.getTasks.mockReturnValue([
        { id: 1, priority: '1' },
        { id: 2, priority: '2' }
      ]);
      const req = { url: '/tasks?sortBy=priority&order=desc' };
      tasks.list(req, res, user);
      expect(utils.sendJson).toHaveBeenCalledWith(res, 200, [
        { id: 2, priority: '2' },
        { id: 1, priority: '1' }
      ]);
    });
  });

  describe('create', () => {
    it('creates a task with valid data', async () => {
      utils.parseBody.mockResolvedValue({ title: 'Test', description: 'desc' });
      const taskObj = { id: 1, title: 'Test', description: 'desc' };
      store.addTask.mockReturnValue(taskObj);
      await tasks.create({}, res, user);
      expect(store.addTask).toHaveBeenCalledWith(user.id, expect.objectContaining({ title: 'Test' }));
      expect(utils.sendJson).toHaveBeenCalledWith(res, 201, taskObj);
    });

    it ('returns 400 if title missing', async () => {
      utils.parseBody.mockResolvedValue({ title: '' });
      await tasks.create({}, res, user);
      expect(utils.sendJson).toHaveBeenCalledWith(res, 400, { error: 'title required' });
    });
  });

  describe('get', () => {
    it('returns task if found', () => {
      store.findTask.mockReturnValue({ id: 1 });
      tasks.get({}, res, user, 1);
      expect(utils.sendJson).toHaveBeenCalledWith(res, 200, { id: 1 });
    });

    it('returns 404 if not found', () => {
      store.findTask.mockReturnValue(undefined);
      tasks.get({}, res, user, 1);
      expect(utils.sendJson).toHaveBeenCalledWith(res, 404, { error: 'not found' });
    });
  });

  describe('update', () => {
    it('updates task fields', async () => {
      const task = { id: 1, title: 'Old', description: 'old', priority: 1, status: 'todo' };
      store.findTask.mockReturnValue(task);
      utils.parseBody.mockResolvedValue({ title: 'New', description: 'new', priority: 2, status: 'done' });
      await tasks.update({}, res, user, 1);
      expect(task.title).toBe('New');
      expect(task.description).toBe('new');
      expect(task.priority).toBe(2);
      expect(task.status).toBe('done');
      expect(utils.sendJson).toHaveBeenCalledWith(res, 200, task);
    });

    it('returns 404 if not found', async () => {
      store.findTask.mockReturnValue(undefined);
      await tasks.update({}, res, user, 1);
      expect(utils.sendJson).toHaveBeenCalledWith(res, 404, { error: 'not found' });
    });

    it('returns 400 if title invalid', async () => {
      const task = { id: 1, title: 'Old' };
      store.findTask.mockReturnValue(task);
      utils.parseBody.mockResolvedValue({ title: '' });
      await tasks.update({}, res, user, 1);
      expect(utils.sendJson).toHaveBeenCalledWith(res, 400, { error: 'title required' });
    });
  });

  describe('patchStatus', () => {
    it('updates status', async () => {
      const task = { id: 1, status: 'todo' };
      store.findTask.mockReturnValue(task);
      utils.parseBody.mockResolvedValue({ status: 'done' });
      await tasks.patchStatus({}, res, user, 1);
      expect(task.status).toBe('done');
      expect(utils.sendJson).toHaveBeenCalledWith(res, 200, task);
    });

    it('returns 404 if not found', async () => {
      store.findTask.mockReturnValue(undefined);
      await tasks.patchStatus({}, res, user, 1);
      expect(utils.sendJson).toHaveBeenCalledWith(res, 404, { error: 'not found' });
    });

    it('returns 400 if status missing', async () => {
      const task = { id: 1, status: 'todo' };
      store.findTask.mockReturnValue(task);
      utils.parseBody.mockResolvedValue({});
      await tasks.patchStatus({}, res, user, 1);
      expect(utils.sendJson).toHaveBeenCalledWith(res, 400, { error: 'status required' });
    });
  });

  describe('remove', () => {
    it('removes task', () => {
      store.deleteTask.mockReturnValue(true);
      tasks.remove({}, res, user, 1);
      expect(utils.sendJson).toHaveBeenCalledWith(res, 204, {});
    });

    it('returns 404 if not found', () => {
      store.deleteTask.mockReturnValue(false);
      tasks.remove({}, res, user, 1);
      expect(utils.sendJson).toHaveBeenCalledWith(res, 404, { error: 'not found' });
    });
  });
});