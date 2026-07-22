// Central error handler - turns errors into clean JSON responses.
function errorHandler(err, req, res, next) {
  // Mongoose validation errors (missing/invalid fields)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(' ') });
  }
  // Duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, message: `That ${field} is already in use.` });
  }
  // Bad MongoDB id format
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid id format.' });
  }
  console.error(err);
  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Something went wrong on the server.',
  });
}

module.exports = errorHandler;
