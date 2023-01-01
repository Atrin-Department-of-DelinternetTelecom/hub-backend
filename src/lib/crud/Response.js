//@ts-check
'use strict';
const { respondCreated } = require('@utils/response');
const { respondSuccess } = require('@utils/response');
const {
  default: ValidationException,
} = require('./Exceptions/ValidationException');
const { writeJson, writeFile } = require('@utils/writer');
const NotFound = require('./Exceptions/NotFound');
const { errorHandler } = require('@api/middlewares/error_handler');
const { errors } = require('@api/http/http_errors');

module.exports = class Response {
  /**
   * Preapre field for json.
   *
   * @return {Object}
   */
  apply(app) {
    /**
     * Send create response to the reqeust.
     *
     * @param {Object} data
     * @return {void}
     */
    app.response.respondCreated = function (data) {
      writeJson(this, respondCreated(data));
    };

    /**
     * Send update response to the reqeust.
     *
     * @param {Object} data
     * @return {void}
     */
    app.response.respondUpdated = function (data) {
      this.respondSuccess(data);
    };

    /**
     * Send delete response to the reqeust.
     *
     * @param {Object} data
     * @return {void}
     */
    app.response.respondDeleted = function (data) {
      this.respondSuccess(data);
    };

    /**
     * Send success response to the reqeust.
     *
     * @param {Object} data
     * @return {void}
     */
    app.response.respondSuccess = function (data) {
      writeJson(this, respondSuccess(data));
    };

    /**
     * Send success response to the reqeust.
     *
     * @param {{filename: string, buffer: Buffer}} file
     * @return {void}
     */
    app.response.respondDownload = function (file) {
      writeFile(this, { ...file, type: 'attachment' });
    };

    /**
     * Send error response to the reqeust.
     *
     * @param {any} error
     * @return {void}
     */
    app.response.respondError = function (error) {
      if (error instanceof NotFound) {
        this.respondNotFound(error);
      } else if (error instanceof ValidationException) {
        this.respondValidationFailed(error);
      } else {
        this.respondInternalServerError(error);
      }
    };

    /**
     * Send not found response to the reqeust.
     *
     * @param {any} error
     * @return {void}
     */
    app.response.respondNotFound = function (error) {
      errorHandler(new errors.NotFound(error.toString()), this.req, this);
    };

    /**
     * Send validation fails response to the reqeust.
     *
     * @param {any} error
     * @return {void}
     */
    app.response.respondValidationFailed = function (error) {
      errorHandler(error, this.req, this);
    };

    /**
     * Send internal error response to the reqeust.
     *
     * @param {any} error
     * @return {void}
     */
    app.response.respondInternalServerError = function (error) {
      errorHandler(error, this.req, this);
    };
  }
};
