//@ts-check
'use strict';

const { DelinternetHotlink } = require('@models').system;
const HotlinkFields = require('./fields/Hotlink');
const Resource = require('@lib/crud/Resource');

module.exports = class Hotlink extends Resource {
  /**
   * Get the uri key.
   *
   * @return string
   */
  uriKey() {
    return 'delinternet-' + super.uriKey();
  }

  /**
   * Get the list of fields.
   *
   * @param {?Object} request
   * @return {array}
   */
  fields(request) {
    return new HotlinkFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return DelinternetHotlink;
  }
};
