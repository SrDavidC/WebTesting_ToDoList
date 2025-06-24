const { createUser, verifyUser } = require('../lib/store');
const { signToken } = require('../lib/auth');
const { sendJson, parseBody } = require('../lib/utils');

function register(req, res) {
  parseBody(req)
    .then(({ username, password }) => {
      if (!username || !password) {
        return sendJson(res, 400, { error: 'username and password required' });
      }
      if (verifyUser(username, password)) {
        return sendJson(res, 400, { error: 'user exists' });
      }
      const { id } = createUser(username, password);
      const token = signToken({ id, username });
      sendJson(res, 201, { token });
    })
    .catch(() => sendJson(res, 400, { error: 'invalid json' }));
}

function login(req, res) {
  parseBody(req)
    .then(({ username, password }) => {
      if (!username || !password) {
        return sendJson(res, 400, { error: 'username and password required' });
      }
      const verified = verifyUser(username, password);
      if (!verified) return sendJson(res, 401, { error: 'invalid credentials' });
      const token = signToken({ id: verified.id, username });
      sendJson(res, 200, { token });
    })
    .catch(() => sendJson(res, 400, { error: 'invalid json' }));
}

module.exports = { register, login };
