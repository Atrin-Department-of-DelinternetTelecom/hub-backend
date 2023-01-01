//@ts-check
'use strict';
const { system } = require('@models');
const Resource = require('@lib/crud/Resource');
const ID = require('@lib/crud/Fields/ID');
const DateTime = require('@lib/crud/Fields/DateTime');
const BooleanField = require('@lib/crud/Fields/Boolean');
const Text = require('@lib/crud/Fields/Text');

module.exports = class CallMeTag extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {?Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),
      new Text('name').required().sortable().filterable(),
      new Text('description').nullable(),
      new BooleanField('comment_required')
        .default(false)
        .sortable()
        .filterable(),
      new DateTime('created_at', 'created_at').exceptOnForms(),
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return system.CallMeTag;
  }
};
