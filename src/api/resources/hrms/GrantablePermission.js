//@ts-check
'use strict';

const BooleanField = require('@lib/crud/Fields/Boolean');
const ID = require('@lib/crud/Fields/ID');
const Json = require('@lib/crud/Fields/Json');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');
const { system } = require('@models');

module.exports = class GrantablePermission extends Resource {
  /**
   * Determine that need to "delete" API.
   *
   * @type {Boolean}
   */
  configureDeleteSwagger = false;

  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return [
      new ID(),
      new Json('name')
        .sortable()
        .filterable()
        .rules('required')
        .default({ ca: '', es: '' })
        .help("{ ca: '...', es: '...' }"),
      new Text('description').sortable().filterable(),
      new BooleanField('active').sortable().filterable().default(false),
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return system.GrantablePermission;
  }
};
