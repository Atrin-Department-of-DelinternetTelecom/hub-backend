//@ts-check
'use strict';

const ID = require('@lib/crud/Fields/ID');
const { CrChat } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');
const NumberField = require('@lib/crud/Fields/Number');
const Text = require('@lib/crud/Fields/Text');
const BooleanField = require('@lib/crud/Fields/Boolean');
const DateTime = require('@lib/crud/Fields/DateTime');

module.exports = class CrmChat extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),
      new NumberField('from', 'fromUserId').nullable().sortable().filterable(),
      new NumberField('to', 'toUserId').nullable().sortable().filterable(),
      new Text('text'),
      new BooleanField('read').default(false).sortable().filterable(),
      new Text('filter').nullable(),
      new DateTime('creationDate', 'creationDate')
        .nullable()
        .sortable()
        .filterable(),
      new DateTime('updateDate', 'updateDate')
        .nullable()
        .sortable()
        .filterable(),
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return CrChat;
  }
};
