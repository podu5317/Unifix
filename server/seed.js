// Seed script - creates roles, categories and a default admin account.
// Run once after setting up your database:  npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const Role = require('./models/Role');
const Category = require('./models/Category');
const User = require('./models/User');

const ROLES = [
  { name: 'student', description: 'Student or staff member who submits requests' },
  { name: 'officer', description: 'Maintenance officer who resolves requests' },
  { name: 'admin', description: 'Administrator who manages the system' },
];

const CATEGORIES = [
  { name: 'Electrical', description: 'Faulty electricity, sockets, lighting' },
  { name: 'Plumbing', description: 'Leaking pipes, taps, drainage' },
  { name: 'Furniture', description: 'Damaged chairs, desks, beds' },
  { name: 'Internet/Network', description: 'Wi-Fi and network problems' },
  { name: 'Classroom Equipment', description: 'Projectors, whiteboards, AC' },
  { name: 'Hostel Maintenance', description: 'Hostel repairs and complaints' },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Seeding...');

  for (const r of ROLES) {
    await Role.updateOne({ name: r.name }, { $setOnInsert: r }, { upsert: true });
  }
  for (const c of CATEGORIES) {
    await Category.updateOne({ name: c.name }, { $setOnInsert: c }, { upsert: true });
  }

  const adminRole = await Role.findOne({ name: 'admin' });
  const existingAdmin = await User.findOne({ email: 'admin@university.edu' });
  if (!existingAdmin) {
    await User.create({
      name: 'System Administrator',
      email: 'admin@university.edu',
      password: 'Admin@123', // change this after first login!
      role: adminRole._id,
    });
    console.log('Default admin created: admin@university.edu / Admin@123');
  }

  console.log('Seeding complete.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
