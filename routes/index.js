const express = require('express');
const notFound = require('../middleware/notFound');
const errorHandler = require('../middleware/errorHandler');

const userRoutes = require('./userRoutes');
const taskRoutes = require('./taskRoutes');
const home = require('./home');

module.exports = function (app /*, router */) {
  // home
  app.get('/', home);

  // api routes
  app.use('/api/users', userRoutes);
  app.use('/api/tasks', taskRoutes);

  // errors
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
