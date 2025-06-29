const request = require('supertest');
const app = require('../app');

describe('Integration Tests', () => {
  it('should return 200 for the root endpoint', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  it('should authenticate a user successfully', async () => {
    await request(app)
      .post('/api/register')
      .send({ username: 'testuser', password: 'testpassword' });
    const response = await request(app)
      .post('/api/login')
      .send({ username: 'testuser', password: 'testpassword' });
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('should fail authentication with incorrect credentials', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ username: 'wronguser', password: 'wrongpassword' });
    expect(response.status).toBe(401);
  });

  it('should retrieve tasks for an authenticated user', async () => {
    await request(app)
      .post('/api/register')
      .send({ username: 'testuser', password: 'testpassword' });
    const loginResponse = await request(app)
      .post('/api/login')
      .send({ username: 'testuser', password: 'testpassword' });
    const token = loginResponse.body.token;

    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });

  it('should fail to retrieve tasks without authentication', async () => {
    const response = await request(app).get('/api/tasks');
    expect(response.status).toBe(401);
  });
});