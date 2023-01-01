//@ts-check
'use strict';

const ArticleCategoryFields = require('./fields/ArticleCategory');
const { DelinternetArticleCategory } = require('@models').system;
const Resource = require('@lib/crud/Resource');

module.exports = class ArticleCategory extends Resource {
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
    return new ArticleCategoryFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return DelinternetArticleCategory;
  }
};
