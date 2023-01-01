'use strict';
const swaggerJSDoc = require('swagger-jsdoc');
const config = require('@config');
const path = require('path');
const { fromDirSync } = require('@utils/file-utils');
module.exports = function () {
  const files = [];

  fromDirSync(
    path.join(config.get('index.base'), 'api', 'swagger'),
    '.yaml',
    (filename) => files.push(filename),
  );

  const options = {
    swaggerDefinition: {
      swagger: '2.0',
      info: config.get('index.swagger.info'),
      basePath: `/api/v${config.get('index.swagger.versionNumber')}`,
      schemes: config.isLocal() ? ['http', 'https'] : ['https', 'http'],
      securityDefinitions: {
        Bearer: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
          description:
            'The following syntax must be used in the "Authorization" header xxxxxx.yyyyyyy.zzzzzz',
        },
        OAuth2: {
          type: 'oauth2',
          flow: 'implicit',
          authorizationUrl: `http://${config.get(
            'index.server.ip',
          )}:${config.get('index.server.port')}/auth/github`,
          description:
            'Copy the generated token value in the url, and paste it into "Api key authorization"',
        },
        Token: {
          type: 'apiKey',
          name: 'api_key',
          in: 'query',
          description:
            'The following syntax must be used in the "Query" params api_key=....',
        },
        TemporaryToken: {
          type: 'apiKey',
          name: 'tmp',
          in: 'query',
          description:
            'The following syntax must be used in the "Query" params tmp=....',
        },
      },
    },
    consumes: ['application/json'],
    produces: ['application/json'],
    apis: [...files],
  };

  const sjd = swaggerJSDoc(options);

  return sjd;
};
