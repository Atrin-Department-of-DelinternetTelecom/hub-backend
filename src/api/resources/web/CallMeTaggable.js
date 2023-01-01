//@ts-check
'use strict';
const { system } = require('@models');
const Resource = require('@lib/crud/Resource');
const ID = require('@lib/crud/Fields/ID');
const Text = require('@lib/crud/Fields/Text');
const NumberField = require('@lib/crud/Fields/Number');

module.exports = class CallMeTaggable extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: system.CallMe,
      as: 'callMe',
      require: true,
    },
    {
      model: system.CallMeTag,
      as: 'tag',
      require: true,
    },
  ];
  /**
   * Get the list of fields.
   *
   * @param {?Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),
      new NumberField('callme_id').required().sortable().filterable(),
      new NumberField('tag_id').required().sortable().filterable(),
      new Text('comment').nullable(),
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return system.CallMeTaggable;
  }
};
