'use strict';
// @ts-check

const { exec, ls } = require('@lib/shell');
const config = require('@config');

const auth = config.get('index.sequelize.intranet');
const fs = require('fs/promises');

/**
 * @typedef {{ databases: string[] } |
 *  { database: string, tables: string[] }
 * } DumpFrom
 */

/**
 *
 * @param {{
 *   auth: Auth,
 *   outFile: string,
 *   from: DumpFrom,
 *   ignoreTables?: string[],
 * }} param0
 */
function buildCommand({ auth, outFile, from, ignoreTables }) {
  const { host, port, username, password } = auth;

  // TODO(erfan): use a command builder
  let command = `mysqldump --host=${host} --port=${port} --user=${username} --password=${password} --protocol=TCP --quick --single-transaction --column-statistics=0`;

  if ('databases' in from) {
    command += ` --databases ${from.databases.join(' ')}`;
  } else if ('database' in from) {
    command += ` ${from.database} ${from.tables.join(' ')}`;
  }

  if (ignoreTables) {
    command +=
      ' ' + ignoreTables.map((table) => `--ignore-table=${table}`).join(' ');
  }

  command += ` | gzip > ${outFile}`;

  return command;
}

function dump(options) {
  return exec(buildCommand(options));
}

/**
 *
 * @param {{ fileName: string,ignoreTables?: string[] }} param0
 * @returns
 */
async function dumpComplete({
  fileName,
  ignoreTables = ['delinternet_hub.global_backups'],
}) {
  console.log('start complete dump', { fileName });

  await dump({
    auth,
    outFile: `./backups/${fileName}`,
    from: {
      databases: ['delinternet_hub', 'intranet', 'moozaic'],
    },
    ignoreTables,
  });

  const { size } = await fs.stat(`./backups/${fileName}`);

  console.log('finish complete dump', size);

  return {
    size,
  };
}

/**
 *
 * @param {{ fileName: string, database: string, tables: string[] }} param0
 * @returns
 */
async function dumpCustom({ database, tables, fileName }) {
  console.log('start custom dump', { database, tables, fileName });

  await dump({
    auth,
    outFile: `./backups/${fileName}`,
    from: {
      database,
      tables,
    },
  });

  const { size } = await fs.stat(`./backups/${fileName}`);

  console.log('finish custom dump', size);

  return { size };
}

module.exports = {
  dumpComplete,
  dumpCustom,
};
