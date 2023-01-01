// @ts-check
'use strict';
const config = require('./config');

/**
 *
 * @param {string} db
 */
const getConnectionOptions = (db) => {
  const db_type = config.get('index.sequelize.database');
  const { host, port, database, username, password } = config.get(
    `index.sequelize.${db}`,
  );

  return {
    host: host,
    port: parseInt(port),
    database: database,
    username: username,
    password: password,
    dialect: db_type,
    retry: {
      match: [/Deadlock/i],
      max: 200, // Maximum rety 3 times
      backoffBase: 100, // Initial backoff duration in ms. Default: 100,
      backoffExponent: 1.1, // Exponent to increase backoff each try. Default: 1.1
    },
    dialectOptions: {
      bigNumberStrings: true,
    },
  };
};

module.exports = {
  system: getConnectionOptions('system'),
  intranet: getConnectionOptions('intranet'),
};
