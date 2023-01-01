//@ts-check
'use strict';
const { DelinternetPage } = require('@models').system;
const { GlobalMedia } = require('@models').system;
const Resource = require('@lib/crud/Resource');
const PageFields = require('./fields/Page');

module.exports = class Page extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: DelinternetPage,
      as: 'translations',
      include: [
        {
          model: GlobalMedia,
          as: 'media',
        },
      ],
    },
    {
      model: GlobalMedia,
      as: 'media',
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
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return new PageFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return DelinternetPage;
  }
};
