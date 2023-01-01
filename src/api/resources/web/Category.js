//@ts-check
'use strict';
const CategoryFields = require('./fields/Category');
const { DelinternetArticle } = require('@models').system;
const { DelinternetCategory } = require('@models').system;
const { GlobalMedia } = require('@models').system;
const Resource = require('@lib/crud/Resource');
const WebsiteCategory = require('./scopes/WebsiteCategory');

module.exports = class Category extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: DelinternetArticle,
      attributes: ['id'],
    },
    { model: DelinternetCategory, as: 'category' },
    {
      model: DelinternetCategory,
      as: 'translations',
      include: [
        { model: DelinternetCategory, as: 'category' },
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
   * @return {Array}
   */
  fields(request) {
    return new CategoryFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return DelinternetCategory;
  }

  /**
   * Get the list of the resource scopes.
   *
   * @return {array}
   */
  scopes() {
    return [new WebsiteCategory()];
  }
};
