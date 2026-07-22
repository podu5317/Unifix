// Tests for service request endpoints, RBAC and workflow.
const request = require('supertest');
const app = require('../app');
const { connect, disconnect } = require('./setup');
const Role = require('../models/Role');
const User = require('../models/User');
const Category = require('../models/Category');

let studentToken, officerToken, adminToken;
let officerId, categoryId, requestId;

beforeAll(async () => {
  await connect();

  // Create one user of each role directly in the database.
  const roles = {};
  for (const name of ['student', 'officer', 'admin']) {
    roles[name] = await Role.findOne({ name });
  }
  await User.create([
    { name: 'Stu Dent', email: 'stu@test.com', password: 'pass123', role: roles.student._id },
    { name: 'Off Icer', email: 'off@test.com', password: 'pass123', role: roles.officer._id },
    { name: 'Ad Min', email: 'adm@test.com', password: 'pass123', role: roles.admin._id },
  ]);

  const login = (email) =>
    request(app).post('/api/auth/login').send({ email, password: 'pass123' });

  studentToken = (await login('stu@test.com')).body.token;
  const offRes = await login('off@test.com');
  officerToken = offRes.body.token;
  officerId = offRes.body.user.id;
  adminToken = (await login('adm@test.com')).body.token;

  categoryId = (await Category.findOne({ name: 'Electrical' }))._id.toString();
});

afterAll(disconnect);

describe('Service Request API', () => {
  test('student can create a request', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Broken socket in Lab 2',
        description: 'The wall socket sparks when used.',
        category: categoryId,
        location: 'Science Block, Lab 2',
        priority: 'high',
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.request.status).toBe('pending');
    requestId = res.body.request._id;
  });

  test('rejects request creation without required fields', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Missing everything else' });
    expect(res.statusCode).toBe(400);
  });

  test('unauthenticated users cannot create requests', async () => {
    const res = await request(app).post('/api/requests').send({});
    expect(res.statusCode).toBe(401);
  });

  test('student sees their own requests with pagination info', async () => {
    const res = await request(app)
      .get('/api/requests')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.requests.length).toBe(1);
    expect(res.body.pagination.total).toBe(1);
  });

  test('student cannot assign requests (RBAC)', async () => {
    const res = await request(app)
      .put(`/api/requests/${requestId}/assign`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ officerId });
    expect(res.statusCode).toBe(403);
  });

  test('admin can assign a request to an officer', async () => {
    const res = await request(app)
      .put(`/api/requests/${requestId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ officerId, note: 'Please handle today' });
    expect(res.statusCode).toBe(200);
    expect(res.body.request.status).toBe('assigned');
  });

  test('officer can update status of an assigned request', async () => {
    const res = await request(app)
      .put(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ status: 'in_progress', note: 'Working on it' });
    expect(res.statusCode).toBe(200);
    expect(res.body.request.status).toBe('in_progress');
  });

  test('officer can mark job completed', async () => {
    const res = await request(app)
      .put(`/api/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ status: 'completed' });
    expect(res.statusCode).toBe(200);
    expect(res.body.request.status).toBe('completed');
  });

  test('request detail includes audit-trail history', async () => {
    const res = await request(app)
      .get(`/api/requests/${requestId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    const actions = res.body.history.map((h) => h.action);
    expect(actions).toContain('REQUEST_CREATED');
    expect(actions).toContain('REQUEST_ASSIGNED');
    expect(actions).toContain('STATUS_UPDATED');
  });

  test('search filter works', async () => {
    const res = await request(app)
      .get('/api/requests?search=socket')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.requests.length).toBeGreaterThan(0);
  });

  test('admin stats endpoint counts requests', async () => {
    const res = await request(app)
      .get('/api/requests/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.stats.total).toBe(1);
    expect(res.body.stats.completed).toBe(1);
  });

  test('admin can view the activity log', async () => {
    const res = await request(app)
      .get('/api/logs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.logs.length).toBeGreaterThan(0);
  });

  test('student cannot view the activity log (RBAC)', async () => {
    const res = await request(app)
      .get('/api/logs')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(403);
  });
});
