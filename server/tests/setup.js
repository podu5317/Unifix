// Test helpers - spin up an in-memory MongoDB so tests never touch real data.
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

const mongoose = require('mongoose');
const Role = require('../models/Role');
const Category = require('../models/Category');

let mongod;

async function connect() {
  // Normally an in-memory MongoDB is started for tests.
  // Set TEST_MONGO_URI to use an existing MongoDB-compatible server instead.
  if (process.env.TEST_MONGO_URI) {
    const dbName = `unifix_test_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    await mongoose.connect(`${process.env.TEST_MONGO_URI}/${dbName}`);
  } else {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }
  // seed roles + one category for tests
  await Role.create([
    { name: 'student', description: '' },
    { name: 'officer', description: '' },
    { name: 'admin', description: '' },
  ]);
  await Category.create({ name: 'Electrical', description: '' });
}

async function disconnect() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

module.exports = { connect, disconnect };
