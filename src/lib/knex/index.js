'use strict';

const knex = require('knex');
const config = require('@config');

// TODO(erfan): rewrite this file

/** @typedef {import("knex").Knex} Knex */

exports.moozaic = knex({
  client: 'mysql2',
  connection: {
    host: config.get('index.sequelize.moozaic.host'),
    port: config.get('index.sequelize.moozaic.port'),
    user: config.get('index.sequelize.moozaic.username'),
    password: config.get('index.sequelize.moozaic.password'),
    database: config.get('index.sequelize.moozaic.database'),
  },
});

/** @type {Knex} */
exports.intranet = knex({
  client: 'mysql2',
  connection: {
    host: config.get('index.sequelize.intranet.host'),
    port: config.get('index.sequelize.intranet.port'),
    user: config.get('index.sequelize.intranet.username'),
    password: config.get('index.sequelize.intranet.password'),
    database: config.get('index.sequelize.intranet.database'),
  },
});

/** @type {Knex} */
exports.delstats = knex({
  client: 'mysql2',
  connection: {
    host: config.get('index.sequelize.delstats.host'),
    port: config.get('index.sequelize.delstats.port'),
    user: config.get('index.sequelize.delstats.username'),
    password: config.get('index.sequelize.delstats.password'),
    database: config.get('index.sequelize.delstats.database'),
  },
});

/** @type {Knex} */
exports.system = knex({
  client: 'mysql2',
  connection: {
    host: config.get('index.sequelize.system.host'),
    port: config.get('index.sequelize.system.port'),
    user: config.get('index.sequelize.system.username'),
    password: config.get('index.sequelize.system.password'),
    database: config.get('index.sequelize.system.database'),
  },
});
exports.connect = async function () {
  /** @type {Knex} */
};
