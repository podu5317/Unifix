// DEMO MODE - runs the full app with ZERO database setup.
// It starts a temporary MongoDB on your computer automatically,
// seeds sample data, and starts the API. Just run:  npm run demo
process.env.JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-change-me';
process.env.JWT_EXPIRES_IN = '1d';

const mongoose = require('mongoose');

async function main() {
  console.log('Starting temporary MongoDB (first run downloads it, please wait)...');
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  console.log('Temporary MongoDB running.');

  const Role = require('./models/Role');
  const Category = require('./models/Category');
  const User = require('./models/User');
  const ServiceRequest = require('./models/ServiceRequest');
  const Assignment = require('./models/Assignment');
  const ActivityLog = require('./models/ActivityLog');

  // Roles + categories
  const roles = {};
  for (const r of [
    { name: 'student', description: 'Student or staff member' },
    { name: 'officer', description: 'Maintenance officer' },
    { name: 'admin', description: 'Administrator' },
  ]) roles[r.name] = await Role.create(r);

  const cats = {};
  for (const c of [
    { name: 'Electrical', description: 'Faulty electricity, sockets, lighting' },
    { name: 'Plumbing', description: 'Leaking pipes, taps, drainage' },
    { name: 'Furniture', description: 'Damaged chairs, desks, beds' },
    { name: 'Internet/Network', description: 'Wi-Fi and network problems' },
    { name: 'Classroom Equipment', description: 'Projectors, whiteboards, AC' },
    { name: 'Hostel Maintenance', description: 'Hostel repairs and complaints' },
  ]) cats[c.name] = await Category.create(c);

  // Accounts (all passwords: Demo@123)
  const admin = await User.create({ name: 'System Administrator', email: 'admin@university.edu', password: 'Demo@123', role: roles.admin._id });
  const officer = await User.create({ name: 'John Maintenance', email: 'officer@university.edu', password: 'Demo@123', role: roles.officer._id, department: 'Facilities' });
  const officer2 = await User.create({ name: 'Grace Repairs', email: 'officer2@university.edu', password: 'Demo@123', role: roles.officer._id, department: 'Facilities' });
  const student = await User.create({ name: 'Amina Yusuf', email: 'student@university.edu', password: 'Demo@123', role: roles.student._id, department: 'Computer Science' });

  // Sample requests in different states
  const mk = async (data, log) => {
    const r = await ServiceRequest.create(data);
    await ActivityLog.create({ request: r._id, actor: data.requester, action: 'REQUEST_CREATED', details: `"${r.title}" submitted` });
    if (log) await log(r);
    return r;
  };

  await mk({
    title: 'Leaking pipe in Hostel B bathroom',
    description: 'Water has been leaking from the ceiling pipe since yesterday evening. The floor is flooded.',
    category: cats['Plumbing']._id, location: 'Hostel B, Room 12 bathroom', priority: 'urgent',
    requester: student._id,
  });

  await mk({
    title: 'Broken socket in Lab 2',
    description: 'The wall socket near the window sparks when a plug is inserted. It is dangerous.',
    category: cats['Electrical']._id, location: 'Science Block, Lab 2', priority: 'high',
    requester: student._id, status: 'assigned', assignedTo: officer._id,
  }, async (r) => {
    await Assignment.create({ request: r._id, officer: officer._id, assignedBy: admin._id, note: 'Please handle today' });
    await ActivityLog.create({ request: r._id, actor: admin._id, action: 'REQUEST_ASSIGNED', details: `Assigned to ${officer.name} - Please handle today` });
  });

  await mk({
    title: 'Projector not working in LT1',
    description: 'The projector in Lecture Theatre 1 shows no signal from any laptop.',
    category: cats['Classroom Equipment']._id, location: 'Lecture Theatre 1', priority: 'medium',
    requester: student._id, status: 'in_progress', assignedTo: officer2._id,
  }, async (r) => {
    await Assignment.create({ request: r._id, officer: officer2._id, assignedBy: admin._id });
    await ActivityLog.create({ request: r._id, actor: admin._id, action: 'REQUEST_ASSIGNED', details: `Assigned to ${officer2.name}` });
    await ActivityLog.create({ request: r._id, actor: officer2._id, action: 'STATUS_UPDATED', details: 'Status changed to "in_progress" - Checking the HDMI port' });
  });

  await mk({
    title: 'Wi-Fi not working in the library',
    description: 'The campus Wi-Fi shows connected but there is no internet in the library reading room.',
    category: cats['Internet/Network']._id, location: 'Main Library, Reading Room', priority: 'high',
    requester: student._id, status: 'completed', assignedTo: officer._id,
  }, async (r) => {
    await Assignment.create({ request: r._id, officer: officer._id, assignedBy: admin._id });
    await ActivityLog.create({ request: r._id, actor: admin._id, action: 'REQUEST_ASSIGNED', details: `Assigned to ${officer.name}` });
    await ActivityLog.create({ request: r._id, actor: officer._id, action: 'STATUS_UPDATED', details: 'Status changed to "in_progress"' });
    await ActivityLog.create({ request: r._id, actor: officer._id, action: 'STATUS_UPDATED', details: 'Status changed to "completed" - Access point restarted and cable replaced' });
  });

  await mk({
    title: 'Broken chairs in Room 204',
    description: 'Three chairs in Room 204 have broken backrests and cannot be used.',
    category: cats['Furniture']._id, location: 'Admin Block, Room 204', priority: 'low',
    requester: student._id,
  });

  console.log('');
  console.log('Demo data ready. Login accounts (password for all: Demo@123):');
  console.log('  Admin:    admin@university.edu');
  console.log('  Officer:  officer@university.edu');
  console.log('  Student:  student@university.edu');
  console.log('');

  const app = require('./app');
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`UniFix API (demo mode) running on http://localhost:${PORT}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
