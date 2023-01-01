const { app, bootstrap } = require('./../src/app');

module.exports = async (globalConfig, projectConfig) => {
  globalThis.app = app;
  // bootstrap application
  await bootstrap();
};
