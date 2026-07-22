// Tests for authentication endpoints.
const request = require('supertest');
const app = require('../app');
const { connect, disconnect } = require('./setup');

beforeAll(connect);
afterAll(disconnect);

describe('Auth API', () => {
  const userData = { name: 'Test Student', email: 'student@test.com', password: 'pass123' };

  test('registers a new user and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(userData);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('student');
  });

  test('rejects duplicate email registration', async () => {
    const res = await request(app).post('/api/auth/register').send(userData);
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('rejects registration with missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'x@y.com' });
    expect(res.statusCode).toBe(400);
  });

  test('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: userData.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/auth/me returns profile when logged in', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: userData.email, password: userData.password });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe(userData.email);
  });

  test('GET /api/auth/me rejects missing token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});
