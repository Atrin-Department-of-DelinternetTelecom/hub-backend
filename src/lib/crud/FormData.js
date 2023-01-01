'use strict';
const Resource = require('./Resource');

module.exports = class FormData extends Resource {
  /**
   * Get collection of fields.
   *
   * @param {Object} request
   * @return {any}
   */
  fieldCollection(request) {
    const callback = function (field) {
      return field.in === 'body' ? field.through('formData') : field;
    };

    return super.fieldCollection(request).map(callback);
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
      consumes: ['multipart/form-data'],
      produces: ['application/json'],
      parameters: this.fieldCollection(request).forCreation().toSwaggerConfig(),
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
  updateSwagger(request) {
    return {
      tags: [this.uriKey()],
      summary: 'Your PUT endpoint',
      description: `Update a ${this.label()} for given id`,
      operationId: `update`,
      security: [{ Bearer: [] }],
      consumes: ['multipart/form-data'],
      produces: ['application/json'],
      parameters: this.fieldCollection(request).forUpdating().toSwaggerConfig(),
      responses: {
        200: this.updateResponse(),
        ...this.commonResponses(),
      },
      'x-swagger-router-controller': 'ResourceUpdateController',
      'x-resource-name': this.uriKey(),
    };
  }
};
