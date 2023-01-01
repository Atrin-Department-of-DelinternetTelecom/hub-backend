//@ts-check
'use strict';
const { User } = require('@models').system;
const {
  UserCalendar: Model,
} = require('@api/models/global/global_user_calendar');
const BooleanField = require('@lib/crud/Fields/Boolean');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');

module.exports = class UserCalendar extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: User,
      required: false,
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {typeof import("@crud/Request")} request
   * @return {Array<Field>}
   */
  fields(request) {
    return [
      new ID(),

      new NumberField('user_id')
        .sortable()
        .filterable()
        .required()
        .hideWhenUpdating(),

      new Text('color')
        .sortable()
        .filterable()
        .required()
        .default('lightslategray'),

      new BooleanField('pinned')
        .sortable()
        .filterable()
        .required()
        .default(false),

      new BooleanField('selectedByDefault')
        .sortable()
        .filterable()
        .required()
        .default(false),
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return Model;
  }
};
