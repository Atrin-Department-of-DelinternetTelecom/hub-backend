//@ts-check
'use strict';

const { GlobalMedia } = require('@models').system;
const MediaFields = require('./fields/Media');
const Resource = require('@lib/crud/FormData');

module.exports = class Media extends Resource {
  /**
   * Get the uri key.
   *
   * @return string
   */
  uriKey() {
    return 'global-' + super.uriKey();
  }

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return new MediaFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return GlobalMedia;
  }
};
