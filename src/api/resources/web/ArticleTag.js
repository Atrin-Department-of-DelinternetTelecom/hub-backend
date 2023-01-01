//@ts-check
'use strict';

const ArticleTagFields = require('./fields/ArticleTag');
const { DelinternetArticleTag } = require('@models').system;
const Resource = require('@lib/crud/Resource');

module.exports = class ArticleTag extends Resource {
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
    return new ArticleTagFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return DelinternetArticleTag;
  }
};
