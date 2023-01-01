'use strict';
const { Sequelize } = require('sequelize');
const config = require('@config');
const { enableSqlTracing, slowQueryLogger } = require('@lib/logger');
const databaseNames = ['moozaic', 'intranet', 'system'];

/**
 * @type {{
 *   name: string;
 *   connection: Sequelize;
 * }[]}
 */
const connections = databaseNames.map(CreateConnection);

/**
 *
 * @param {string} db
 * @returns {{
 *   name: string;
 *   connection: Sequelize;
 * }}
 */
function CreateConnection(db) {
  const db_type = config.get('index.sequelize.database');
  const { host, port, database, username, password } = config.get(
    `index.sequelize.${db}`,
  );

  const disableLogging = process.env.DISABLE_QUERY_LOGS === 'true';

  const connection = new Sequelize({
    database,
    host,
    port,
    username,
    password,
    dialect: db_type,
    dialectOptions: {
      multipleStatements: true,
      timezone: 'local',
    },
    timezone: process.env.TZ,
    benchmark: true,
    // !!! WARNING: Tracing may cause prepared statement leaks !!!!!!!!!!!!!!!!!!
    // TODO: DO NOT inject dynamic trace comments into SQL sent to MySQL.
    //       It creates thousands of unique prepared statements and can crash the DB.
    //       Use only in development for debugging stack traces.
    logging: disableLogging ? undefined : slowQueryLogger,
    pool: {
      max: 15,
      min: 5,
      acquire: 40000,
      idle: 10000,
    },
  });

  // !!! WARNING: Tracing may cause prepared statement leaks !!!!!!!!!!!!!!!!!!
  // TODO: DO NOT inject dynamic trace comments into SQL sent to MySQL.
  //       It creates thousands of unique prepared statements and can crash the DB.
  //       Use only in development for debugging stack traces.
  if (process.env.NODE_ENV === 'development' && !disableLogging) {
    enableSqlTracing(connection);
  }

  connection.dialect.supports.schemas = true;

  return {
    name: db,
    connection,
  };
}

/**
 * Monitor Sequelize pool stats (for Sequelize v6)
 * @param {Sequelize} sequelize
 * @param {string} name
 */
function monitorPool(sequelize, name) {
  setInterval(() => {
    const pool = sequelize.connectionManager.pool;

    if (!pool || typeof pool.size !== 'function') {
      console.warn(
        `[Pool Monitor Warning - ${name}]: Pool is not ready or not standard sequelize-pool`,
      );
      return;
    }

    try {
      const stats = {
        size: pool.size(),
        available: pool.available(),
        borrowed: pool.borrowed(),
        pending: pool.pending(),
      };

      console.log(`[Pool Stats - ${name}]`);
      console.log(`→ Total pool size:      ${stats.size}`);
      console.log(`→ In use (borrowed):    ${stats.borrowed}`);
      console.log(`→ Idle (available):     ${stats.available}`);
      console.log(`→ Waiting (pending):    ${stats.pending}`);
    } catch (err) {
      console.warn(`[Pool Monitor Error - ${name}]:`, err.message);
    }
  }, 10000);
}

exports.connect = async function () {
  await Promise.all(
    connections.map(async (c) => {
      try {
        await c.connection.authenticate();
      } catch (error) {
        console.error(
          Error,
          `Unable to connect to the ${c.name} database`,
          error,
        );
        throw error;
      }
    }),
  );
};

/**
 *
 * @param {string} name
 * @returns {Sequelize | null}
 */
exports.getConnectionFor = (name) =>
  connections.find((c) => c.name === name)?.connection ?? null;

exports.close = async () => {
  for (const sequelize of connections) {
    await sequelize.close();
  }
};
