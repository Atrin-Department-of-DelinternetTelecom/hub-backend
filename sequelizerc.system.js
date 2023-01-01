// @ts-check
require('module-alias')();
require('./src/dotenv');
const path = require('path');

module.exports = {
  config: path.resolve('src', 'sequelize-config.js'),
  'models-path': path.resolve('src', 'api', 'models', 'delinternet'),
  'seeders-path': path.resolve('src', 'api', 'seeders'),
  'migrations-path': path.resolve('src', 'api', 'migrations', 'delinternet'),
};
