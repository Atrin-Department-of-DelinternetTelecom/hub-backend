//@ts-check
'use strict';

const DataInternetUploadImage = require('./actions/DataInternetUploadImage');
const DataInternetDownloadImage = require('./actions/DataInternetDownloadImage');
const GfContractDataInternetFields = require('./fields/GfContractDataInternet');
const { GfContractDataInternet: Model } = require('@models').intranet;
const Resource = require('@lib/crud/FormData');
const pluralize = require('pluralize');
const BulkUpdateIpSix = require('./actions/BulkUpdateIpSix');
const SetIpSix = require('./actions/SetIpSix');
const CompressDataInternetImages = require('./actions/CompressDataInternetImages');
const DeleteAutofindAction = require('./actions/DeleteAutofindAction');

module.exports = class GfContractDataInternet extends Resource {
  /**
   * Determine that need to index API.
   *
   * @type {Boolean}
   */
  configureIndexSwagger = false;

  /**
   * Determine that need to creation API.
   *
   * @type {Boolean}
   */
  configureCreateSwagger = false;

  /**
   * Determine that need to delete API.
   *
   * @type {Boolean}
   */
  configureDeleteSwagger = false;

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return array
   */
  fields(request) {
    return new GfContractDataInternetFields().fields(request);
  }

  model() {
    return Model;
  }

  actions() {
    return [
      new DataInternetUploadImage().inline(),
      new DataInternetDownloadImage().inline(),
      new BulkUpdateIpSix().standalone(),
      new SetIpSix(),
      new CompressDataInternetImages().standalone(),
      new DeleteAutofindAction().standalone(),
    ];
  }

  uriKey() {
    return 'gf-contract-data-internet';
  }

  /**
   * Get swagger config for index.
   *
   * @param {Object} request
   * @return {Object}
   */
  indexSwagger(request) {
    return {
      ...super.indexSwagger(request),
      'x-swagger-router-controller': this.name(),
      operationId: `get${pluralize(this.name())}`,
    };
  }

  /**
   * Get swagger config for creation.
   *
   * @param {Object} request
   * @return {Object}
   */
  creationSwagger(request) {
    return {
      ...super.creationSwagger(request),
      'x-swagger-router-controller': this.name(),
      operationId: `post${pluralize(this.name())}`,
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
      ...super.viewSwagger(request),
      'x-swagger-router-controller': this.name(),
      operationId: `get${pluralize(this.name())}Id`,
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
      ...super.updateSwagger(request),
      'x-swagger-router-controller': this.name(),
      operationId: `put${pluralize(this.name())}Id`,
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
      ...super.deleteSwagger(request),
      'x-swagger-router-controller': this.name(),
      operationId: `delete${pluralize(this.name())}Id`,
    };
  }
};
