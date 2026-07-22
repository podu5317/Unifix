// Express app definition (kept separate from server.js so tests can import it).
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/requests');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');
const logRoutes = require('./routes/logs');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || '*' }));
app.use(express.json());

// Serve uploaded evidence images.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/logs', logRoutes);

// Simple health check (useful to confirm deployment works).
app.get('/api/health', (req, res) => res.json({ success: true, message: 'UniFix API is running' }));

app.use(errorHandler);

module.exports = app;
