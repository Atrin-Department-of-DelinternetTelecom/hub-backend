/* eslint-disable @typescript-eslint/no-var-requires */
import 'module-alias/register';
import './dotenv';

import Http from 'node:http';
import bodyParser from 'body-parser';
import config from './config';
import cors from 'cors';
import { downloadFile } from '@api/service/file/fileService';
import { errorHandler } from '@middlewares/error_handler/index';
import express from 'express';
import fileUpload from 'express-fileupload';
import inventoryProxy from '@api/middlewares/inventoryProxy';
import { isProduction } from '@config';
// eslint-disable-next-line node/no-unpublished-import
import morgan from 'morgan';
import { writeFile } from '@api/utils/writer';

export const app = express();

// Custom Morgan format to include req.user.id
morgan.token('user_id', (req: any, res) => {
  return req.user ? req.user.id : 'Guest';
});

export const bootstrap = async (server?: Http.Server) => {
  console.time('bootstraping ....');
  console.debug(
    `Running app in mode "${config.get('index.mode', 'production')}"!`,
  );
  // apply cors only in production
  // in development mode, we allow all origins
  app.use(
    cors({
      // origin: !isProduction()
      //   ? '*'
      //   : function (origin, callback) {
      //       try {
      //         if (
      //           !origin ||
      //           /\.delinternet\.com$/.test(new URL(origin).hostname) ||
      //           ['localhost', '127.0.0.1'].includes(new URL(origin).hostname)
      //         ) {
      //           callback(null, true);
      //         } else {
      //           callback(new Error('Not allowed by CORS (Domain Restricted).'));
      //         }
      //       } catch (err) {
      //         callback(new Error('Not allowed by CORS (Invalid Origin).'));
      //       }
      //     },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      exposedHeaders: ['Content-Disposition'],
      optionsSuccessStatus: 200,
      maxAge: 43200,
    }),
  );

  // serve static
  const staticsPath = config.get<
    Array<{ uri: string; path: string; bucket?: string }>
  >('static.serves', []);

  for (const { uri, path, bucket } of staticsPath) {
    if (bucket) {
      app.get(`${uri}`, (req, res) => {
        downloadFile(req.params.filename, bucket)
          .then(({ data: buffer, filename }) => {
            writeFile(res, { buffer, filename });
          })
          .catch((e) => errorHandler(e, req, res));
      });
    } else {
      app.use(`${uri}`, express.static(path));
    }
  }

  console.time('initializing sequelize');
  await require('./lib/knex').connect();
  await require('./lib/sequelize').connect();
  console.timeEnd('initializing sequelize');

  console.time('initializing mail sender');
  await require('./lib/mailer');
  console.timeEnd('initializing mail sender');

  console.time('initializing socket');
  const socketAuth = require('@middlewares/socketAuthentication').default;
  require('./lib/socket').init(server, socketAuth);
  console.timeEnd('initializing socket');

  console.time('initializing express');
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(
    bodyParser.urlencoded({
      limit: '50mb',
      extended: true,
      parameterLimit: 50000,
    }),
  );
  app.use(fileUpload());

  app.use(
    morgan(
      ':response-time ms - :remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" userId=:user_id',
    ),
  );

  if (config.get('index.inventory.proxy'))
    app.use('/proxy-to-inventory', inventoryProxy());

  console.timeEnd('initializing express');

  console.time('initializing crud...');
  await require('./lib/crud').bootstrap(app);
  console.timeEnd('initializing crud...');

  console.time('initializing mqtt...');
  await require('./lib/mqtt').connect();
  console.timeEnd('initializing mqtt...');

  console.time('initializing swagger...');
  await require('./lib/swagger').index(app, () => {
    // register extra middlewares
  });
  console.timeEnd('initializing swagger...');

  console.time('initializing Roles...');
  // generating roles
  await require('@service/acl/Roles').getRoles();

  require('@service/hrms/ClosetService').initBot();

  // register all actions
  require('./api/actions');

  // Start Action Runner
  require('./lib/action-runner').default.start();

  // Start cron jobs
  require('./tasks');

  app.use(errorHandler);
  console.timeEnd('bootstraping ....');

  await require('@service/global/MemoryUsageTeleporter').init();
};

export const createServer = async () => {
  const server = Http.createServer(app);
  const host = config.get<string>('index.server.ip');
  const port = config.get<number>('index.server.port');

  /**
   * it's safer to start http server *after* initialization of app.
   * forever reason if bootstrap function failed, the sever is running but it may not working as expected
   */
  await bootstrap(server)
    .then(() => {
      server.listen(port, host, async () => {
        console.log('mode', config.get('index.mode'));
        console.log('PID', process.pid);
        console.log('start listening on', `http://${host}:${port}`);
      });
    })
    .catch((error) => {
      console.log(error);
      throw error;
    });
};
