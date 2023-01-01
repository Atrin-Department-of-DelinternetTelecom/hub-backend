'use strict';
const _ = require('lodash');
const config = require('@config');
const { fromDirSync } = require('@utils/file-utils');
const path = require('path');
const Resource = require('@lib/crud/Resource');
const Request = require('@lib/crud/Request');
const Response = require('@lib/crud/Response');

module.exports.Resource = Resource;

/**
 * Get available resources.
 *
 * @return {Array}
 */
module.exports.availableResources = _.once(function () {
  const resources = [];
  fromDirSync(
    path.join(config.get('index.base'), 'api', 'resources'),
    '.js',
    (filename) => resources.push(require(filename)),
  );

  return resources
    .filter((resource) => typeof resource === 'function')
    .map((resource) => new resource())
    .filter((resource) => resource instanceof Resource);
});

/**
 * Find resource by the given key.
 *
 * @return {string}
 */
module.exports.findResourceByKey = (resourceName) => {
  return exports.availableResources().find((resource) => {
    return resource.uriKey() === resourceName;
  });
};

/**
 * Find resource by the given model name.
 *
 * @return {string}
 */
module.exports.findResourceByModel = (modelName) => {
  return exports.availableResources().find((resource) => {
    return resource.model() === modelName;
  });
};

module.exports.bootstrap = async function (app) {
  new Request().apply(app, exports.availableResources());
  new Response().apply(app, exports.availableResources());
};
