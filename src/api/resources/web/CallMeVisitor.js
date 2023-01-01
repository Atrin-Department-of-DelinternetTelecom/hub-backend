//@ts-check
'use strict';
const { system } = require('@models');
const Resource = require('@lib/crud/Resource');
const ID = require('@lib/crud/Fields/ID');
const DateTime = require('@lib/crud/Fields/DateTime');
const NumberField = require('@lib/crud/Fields/Number');

module.exports = class CallMeVisitor extends Resource {
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
      model: system.User,
      as: 'visitor',
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
      new NumberField('visitor_id', 'visitor_id')
        .sortable()
        .filterable()
        .nullable()
        .fillUsing((request, model) => {
          model.setDataValue('visitor_id', request.userId());
        }),
      new NumberField('callme_id', 'callme_id').sortable().filterable(),
      new DateTime('created_at', 'created_at').exceptOnForms(),
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return system.CallMeVisitor;
  }
};
