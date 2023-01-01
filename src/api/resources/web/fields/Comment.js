// @ts-check
'use strict';
const ID = require('@lib/crud/Fields/ID');
const ResolvesFields = require('./ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');
const NumberField = require('@lib/crud/Fields/Number');

module.exports = class Comment extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {?Object} request
   * @return array
   */
  fields(request) {
    return [
      new ID(),

      new TextField('Context').required().sortable().filterable(),

      new TextField('Commentable Type').required().sortable().filterable(),

      new NumberField('Commentable Id').required().sortable().filterable(),

      new NumberField('Comment', 'comment_id')
        .nullable()
        .sortable()
        .filterable(),

      new NumberField('User', 'user_id')
        .nullable()
        .sortable()
        .filterable()
        .fillUsing((request, model, attribute) => {
          model.user_id = request.user.id;
        }),
    ];
  }
};
