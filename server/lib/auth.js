const crypto = require('crypto');
const SECRET = 'supersecret';

function base64url(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function signToken(payload) {
  const header = base64url({ alg: 'HS256', typ: 'JWT' });
  const body = base64url(payload);
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(header + '.' + body)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expected = crypto
    .createHmac('sha256', SECRET)
    .update(header + '.' + body)
    .digest('base64url');
  if (expected !== signature) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch {
    return null;
  }
}

function authenticate(req) {
  const auth = req.headers['authorization'];
  if (!auth) return null;
  const token = auth.split(' ')[1];
  return verifyToken(token);
}

module.exports = { signToken, verifyToken, authenticate };
