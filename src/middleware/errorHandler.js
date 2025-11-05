export default function errorHandler(err, _req, res, _next) {
  const isClient =
    err.name === 'ValidationError' ||
    err.name === 'CastError' ||
    err.code === 11000 ||
    err.status === 400;

  const status = isClient ? 400 : err.status || 500;

  let msg = 'Server Error';
  if (err.code === 11000) msg = 'A user with that email already exists.';
  else if (err.name === 'ValidationError') msg = 'Validation failed.';
  else if (err.name === 'CastError') msg = 'Invalid identifier.';
  else if (err.status && err.message) msg = err.message;

  res.status(status).json({ message: msg, data: null });
}
