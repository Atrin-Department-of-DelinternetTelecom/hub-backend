import { getFilterParams, getPaginationParams } from '@utils/pagination';
import swaggerTools, { Middleware20 } from '@erfanium/swagger-tools';

import Config from './config';
import { Express } from 'express';
import { availableResources } from './../crud';
import config from '@config';
import { getDirectoriesSync } from '@utils/file-utils';
import path from 'path';
import { options as securityOptions } from '../../api/security/index';
import swaggerFilter from '@middlewares/swaggerFilter';
import swaggerPagination from '@middlewares/swaggerPagination';
import swaggerUi from 'swagger-ui-express';

const base = config.get<string>('index.base');

function initializeMiddleware(
  config: object,
  options: object,
  app: Express,
  middlewares: () => any,
): Promise<Middleware20> {
  return new Promise((resolve) => {
    swaggerTools.initializeMiddleware(config, function (middleware) {
      app.use(middleware.swaggerMetadata());

      // Provide the security handlers
      app.use(middleware.swaggerSecurity(securityOptions));

      // Validate Swagger requests
      app.use(middleware.swaggerValidator({ validateResponse: false }));

      // Filter swagger - x-filter
      app.use(swaggerFilter);

      // Pagination swagger - x-pagination
      app.use(swaggerPagination);

      // register custom middlewares
      middlewares();

      // Route validated requests to appropriate controller
      app.use(middleware.swaggerRouter(options));

      resolve(middleware);
    });
  });
}

exports.index = async function (app: Express, middlewares: () => any) {
  const swaggerConfig = await Config();

  availableResources().forEach((resource) => {
    swaggerConfig.definitions[resource.name()] = resource.swaggerDefinition(
      app.request,
    );
    swaggerConfig.paths = {
      ...swaggerConfig.paths,
      ...resource.swaggerConfig(app.request),
    };
  });

  const dirs = getDirectoriesSync(path.join(base, 'api', 'controllers'));
  const options = {
    swaggerUi: path.join(base, '/swagger.json'),
    controllers: [
      ...dirs,
      // `${config.base}/api/controllers`
    ],
    useStubs: process.env.NODE_ENV === 'development', // Conditionally turn on stubs (mock mode)
  };

  await initializeMiddleware(swaggerConfig, options, app, middlewares);

  // Serve the Swagger documents and Swagger UI
  //   http://localhost:8000/docs => Swagger UI
  //   http://localhost:8000/api-docs => Swagger document
  // app.use(middleware.swaggerUi());

  manipulateConfig(swaggerConfig);

  if (config.get('index.swagger.enabled')) {
    app.get(`/swagger.json`, (req, res) => res.json(swaggerConfig));
    app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerConfig, {
        swaggerOptions: {
          persistAuthorization: true,
          docExpansion: 'none',
          filter: true,
          displayRequestDuration: true,
          showCommonExtensions: true,
        },
        customSiteTitle: config.get('index.swagger.swagger_title'),
      }),
    );
  }
};

function manipulateConfig(swaggerConfig: any) {
  // Remove Routers from /docs with property x-hide: true
  Object.keys(swaggerConfig.paths).forEach((keyParent, i) => {
    const parent = swaggerConfig.paths[keyParent];
    Object.keys(parent).forEach((keyChild, j) => {
      const child = swaggerConfig.paths[keyParent][keyChild];

      if (
        typeof child === 'object' &&
        'x-hide' in child &&
        child['x-hide'] === true
      ) {
        delete swaggerConfig.paths[keyParent][keyChild];
      }
      if (
        typeof child === 'object' &&
        'x-pagination' in child &&
        child['x-pagination'] === true
      ) {
        if (child.parameters === undefined) {
          child.parameters = [];
        }
        child.parameters.push(...getPaginationParams());
      }
      if (
        typeof child === 'object' &&
        'x-filter' in child &&
        child['x-filter'] === true
      ) {
        if (child.parameters === undefined) {
          child.parameters = [];
        }
        child.parameters.push(...getFilterParams());
      }
    });
  });
}
