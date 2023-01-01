/* eslint-disable @typescript-eslint/no-var-requires */
import 'module-alias/register';
import './dotenv';

// eslint-disable-next-line node/no-unpublished-import

export const bootstrap = async () => {
  console.time('initializing sequelize');
  await require('./lib/knex').connect();
  await require('./lib/sequelize').connect();
  console.timeEnd('initializing sequelize');

  // Start cron jobs
  require('./tasks');
};

bootstrap()
  .then(() => console.log('Cron jobs started'))
  .catch((error) => {
    console.log(error);
    throw error;
  });
