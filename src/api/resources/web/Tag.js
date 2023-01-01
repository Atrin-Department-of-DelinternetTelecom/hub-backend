//@ts-check
'use strict';
const { DelinternetTag } = require('@models').system;
const Resource = require('@lib/crud/Resource');
const TagFields = require('./fields/Tag');

module.exports = class Tag extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: DelinternetTag,
      as: 'translations',
    },
  ];

  /**
   * The column(s) used to "group by" the "index" query.
   *
   * @type {string|Array|null}
   */
  groupBy = 'group';

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
    return new TagFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return DelinternetTag;
  }
};
