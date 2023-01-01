'use strict';
const _ = require('lodash');
const FieldCollection = require('./../Collections/FieldCollection');
const helpers = require('@utils/helpers');
const ID = require('@lib/crud/Fields/ID');
const ResourceResponses = require('./ResourceResponses');

module.exports = class SwaggerResource extends ResourceResponses {
  /**
   * Prevent to configure swagger for `CRUD`.
   *
   * @type {Boolean}
   */
  preventSwagger = false;

  /**
   * Determine that need to "index" API.
   *
   * @type {Boolean}
   */
  configureIndexSwagger = true;

  /**
   * Determine that need to "detail" API.
   *
   * @type {Boolean}
   */
  configureViewSwagger = true;

  /**
   * Determine that need to "create" API.
   *
   * @type {Boolean}
   */
  configureCreateSwagger = true;

  /**
   * Determine that need to "update" API.
   *
   * @type {Boolean}
   */
  configureUpdateSwagger = true;

  /**
   * Determine that need to "delete" API.
   *
   * @type {Boolean}
   */
  configureDeleteSwagger = true;

  /**
   * Get collection of fields.
   *
   * @param {Object} request
   * @return {Collection}
   */
  fieldCollection(request) {
    return new FieldCollection(
      helpers.with(this.fields(request), (fields) => {
        return fields.find((field) => field instanceof ID || field.isPrimary())
          ? fields
          : [new ID(), ...fields];
      }),
    );
  }

  /**
   * Preapare definition for swagger.
   *
   * @param {Object} request
   * @return {Object}
   */
  swaggerDefinition(request) {
    const required = [];
    const properties = {};

    this.fieldCollection(request)
      .forSwagger(request)
      .all()
      .forEach((field) => {
        properties[field.swaggerDefinition.name] = {
          type: field.swaggerDefinition.type,
          description: field.swaggerDefinition.description,
        };

        if (field.required) required.push(field.swaggerDefinition.name);
        if (field.swaggerDefinition.type === 'array') {
          _.set(
            properties,
            `${field.swaggerDefinition.name}.items`,
            field.meta('swagger.items') ?? { type: 'string' },
          );
        }
        if (
          field.swaggerDefinition.type === 'object' &&
          field.meta('swagger.properties')
        ) {
          _.set(
            properties,
            `${field.swaggerDefinition.name}.properties`,
            field.meta('swagger.properties'),
          );
        }
      });

    return {
      type: 'object',
      description: this.name(),
      properties,
      required,
    };
  }

  /**
   * Prepare resource for swager config.
   *
   * @param {Object} request
   * @return {Object}
   */
  swaggerConfig(request) {
    const swagger = {
      ...this.swaggerScopes(request),
      ...this.swaggerActions(request),
    };

    if (this.preventSwagger === true) return swagger;

    const resourceIndex = `/${this.uriKey()}`;
    const resourceDetail = `${resourceIndex}/{id}`;

    swagger[resourceIndex] = {};
    swagger[resourceDetail] = {};

    if (this.configureIndexSwagger ?? true) {
      swagger[resourceIndex].get = this.indexSwagger(request);
    }
    if (this.configureCreateSwagger ?? true) {
      swagger[resourceIndex].post = this.creationSwagger(request);
    }
    if (this.configureViewSwagger ?? true) {
      swagger[resourceDetail].get = this.viewSwagger(request);
    }
    if (this.configureUpdateSwagger ?? true) {
      swagger[resourceDetail].put = this.updateSwagger(request);
    }
    if (this.configureDeleteSwagger ?? true) {
      swagger[resourceDetail].delete = this.deleteSwagger(request);
    }

    return swagger;
  }

  /**
   * Get swager config for scopes.
   *
   * @param {Object} request
   * @return {Object}
   */
  swaggerScopes(request) {
    const callback = (swaggerConfig, scope) => {
      const route = `/${this.uriKey()}/${scope.swaggerRoute()}`;
      swaggerConfig[route] = { get: scope.swaggerConfig(request, this) };

      return swaggerConfig;
    };

    return this.scopes().reduce(callback, {});
  }

  /**
   * Get swager config for actions.
   *
   * @param {Object} request
   * @return {Object}
   */
  swaggerActions(request) {
    const callback = (swaggerConfig, action) => {
      if (action.isDirect()) {
        const route = `/${this.uriKey()}/{id}/${action.swaggerRoute()}`;
        const actionConfig = action.swaggerConfig(request, this);

        swaggerConfig[route] = {
          ...swaggerConfig[route],
          [action.swaggerMethod()]: {
            ...actionConfig,
            parameters: [
              ...this.fieldCollection(request).primaries().toSwaggerConfig(),
              ...actionConfig.parameters,
            ],
          },
        };

        return swaggerConfig;
      } else {
        const route = `/${this.uriKey()}/${action.swaggerRoute()}`;

        swaggerConfig[route] = {
          ...swaggerConfig[route],
          [action.swaggerMethod()]: action.swaggerConfig(request, this),
        };

        return swaggerConfig;
      }
    };

    return this.actions().reduce(callback, {});
  }

  /**
   * Get swagger config for index.
   *
   * @param {Object} request
   * @return {Object}
   */
  indexSwagger(request) {
    return {
      'x-pagination': true,
      'x-filter': true,
      tags: [this.uriKey()],
      description:
        'Possible Filters: ' +
        this.possibleFilters().join(', ') +
        '\n\nPossible Orders: ' +
        this.possibleOrders().join(', '),
      summary: `Get all ${this.label()}`,
      operationId: `index`,
      security: [{ Bearer: [] }],
      consumes: ['application/json'],
      produces: ['application/json'],
      parameters: [],
      responses: {
        200: this.indexResponse(),
        ...this.commonResponses(),
      },
      'x-swagger-router-controller': 'ResourceIndexController',
      'x-resource-name': this.uriKey(),
    };
  }

  possibleFilters() {
    return this.fieldCollection()
      .forIndex()
      .all()
      .filter((field) => field.meta('filterable'))
      .map((field) => field.filterKey());
  }

  possibleOrders() {
    return this.fieldCollection()
      .forIndex()
      .all()
      .filter((field) => field.meta('sortable'))
      .map((field) => field.sortKey());
  }

  /**
   * Get swagger config for creation.
   *
   * @param {Object} request
   * @return {Object}
   */
  creationSwagger(request) {
    return {
      tags: [this.uriKey()],
      summary: 'Your POST endpoint',
      description: `Create new ${this.label()}`,
      operationId: `create`,
      security: [{ Bearer: [] }],
      consumes: ['application/json'],
      produces: ['application/json'],
      parameters: this.convertToJson(
        this.fieldCollection(request).forCreation().toSwaggerConfig(),
      ),
      responses: {
        201: this.creationResponse(),
        ...this.commonResponses(),
      },
      'x-swagger-router-controller': 'ResourceStoreController',
      'x-resource-name': this.uriKey(),
    };
  }

  /**
   * Get swagger config for update.
   *
   * @param {Object} request
   * @return {Object}
   */
  viewSwagger(request) {
    return {
      tags: [this.uriKey()],
      summary: 'Your GET endpoint',
      description: `Get a ${this.label()} for given id`,
      operationId: `show`,
      security: [{ Bearer: [] }],
      consumes: ['application/json'],
      produces: ['application/json'],
      parameters: this.fieldCollection(request).primaries().toSwaggerConfig(),
      responses: {
        200: this.viewResponse(),
        ...this.commonResponses(),
      },
      'x-swagger-router-controller': 'ResourceDetailController',
      'x-resource-name': this.uriKey(),
    };
  }

  /**
   * Get swagger config for update.
   *
   * @param {Object} request
   * @return {Object}
   */
  updateSwagger(request) {
    return {
      tags: [this.uriKey()],
      summary: 'Your PUT endpoint',
      description: `Update a ${this.label()} for given id`,
      operationId: `update`,
      security: [{ Bearer: [] }],
      consumes: ['application/json'],
      produces: ['application/json'],
      parameters: this.convertToJson(
        this.fieldCollection(request).forUpdating().toSwaggerConfig(),
      ),
      responses: {
        200: this.updateResponse(),
        ...this.commonResponses(),
      },
      'x-swagger-router-controller': 'ResourceUpdateController',
      'x-resource-name': this.uriKey(),
    };
  }

  /**
   * Get swagger config for update.
   *
   * @param {Object} request
   * @return {Object}
   */
  deleteSwagger(request) {
    return {
      tags: [this.uriKey()],
      summary: 'Your DELETE endpoint',
      description: `Delete a ${this.label()} for given id`,
      operationId: `destroy`,
      security: [{ Bearer: [] }],
      consumes: ['application/json'],
      produces: ['application/json'],
      parameters: this.fieldCollection(request).primaries().toSwaggerConfig(),
      responses: {
        200: this.simpleResponse(200, 'Resource deleted'),
        ...this.commonResponses(),
      },
      'x-swagger-router-controller': 'ResourceDeleteController',
      'x-resource-name': this.uriKey(),
    };
  }

  /**
   * Prepare parameters for json request.
   *
   * @param  {array} parameters
   * @return {array}
   */
  convertToJson(parameters) {
    const properties = {};
    // const required = [];
    const otherParameters = [];

    for (const field of parameters) {
      if (!['body', 'formData'].includes(field.in)) {
        otherParameters.push(field);
        continue;
      }

      properties[field.name] = {
        type: field.type,
        description: field.description,
        example: _.isNull(field.default) ? '' : field.default,
      };

      // if (field.required) {
      //   required.push(field.name);
      //   properties[field.name].minLength = 1;
      // }

      if (field.type === 'array') {
        _.set(
          properties,
          `${field.name}.items`,
          field.items ?? { type: 'string' },
        );
      }
    }

    const schema = { type: 'object', properties };

    // if (required.length > 0) {
    //   schema['required'] = required;
    // }

    return [
      ...otherParameters,
      {
        in: 'body',
        name: 'body',
        required: true,
        schema,
      },
    ];
  }
};
