//@ts-check
'use strict';

const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');

module.exports = class ArticleCategory extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {?Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),
      new NumberField('Article', 'delinternet_article_id').required(),
      new NumberField('Category', 'delinternet_category_id').required(),
    ];
  }
};
