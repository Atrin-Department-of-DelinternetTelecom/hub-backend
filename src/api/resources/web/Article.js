//@ts-check
'use strict';
const { DelinternetArticle } = require('@models').system;
const { DelinternetCategory } = require('@models').system;
const { DelinternetTag } = require('@models').system;
const { GlobalMedia } = require('@models').system;
const Resource = require('@lib/crud/Resource');
const ArticleFields = require('./fields/Article');
const WebsiteSearchArticle = require('./scopes/WebsiteSearchArticle');

module.exports = class Article extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: GlobalMedia,
      as: 'media',
    },
  ];

  /**
   * Eager loaded relation ships on index.
   *
   * @type {Array}
   */
  includeIndex = [
    {
      model: DelinternetArticle,
      as: 'translations',
      include: [
        {
          model: GlobalMedia,
          as: 'media',
        },
      ],
    },
  ];

  /**
   * The column(s) used to "group by" the "index" query.
   *
   * @type {string|Array|null}
   */
  groupBy = 'group';

  /**
   * Eager loaded relation ships on detail.
   *
   * @type {Array}
   */
  includeDetail = [
    {
      model: DelinternetCategory,
      as: 'categories',
      include: [
        {
          model: DelinternetCategory,
          as: 'allTranslations',
        },
      ],
    },
    {
      model: DelinternetTag,
      as: 'tags',
      include: [
        {
          model: DelinternetTag,
          as: 'allTranslations',
        },
      ],
    },
    {
      model: DelinternetArticle,
      as: 'translations',
      include: [
        { model: DelinternetCategory, as: 'categories' },
        { model: DelinternetTag, as: 'tags' },
        {
          model: GlobalMedia,
          as: 'media',
        },
      ],
    },
  ];

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
    return new ArticleFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return DelinternetArticle;
  }

  /**
   * Get the list of the resource scopes.
   *
   * @return {array}
   */
  scopes() {
    return [new WebsiteSearchArticle()];
  }
};
