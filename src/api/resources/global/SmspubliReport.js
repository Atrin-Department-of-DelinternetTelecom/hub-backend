//@ts-check
'use strict';

const {
  SmspubliReport: Model,
} = require('@api/models/global/global_smspubli_report');
const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');

module.exports = class SmspubliReport extends Resource {
  /**
   * Determine that need to "create" API.
   *
   * @type {Boolean}
   */
  configureCreateSwagger = false;

  /**
   * Determine that need to "update" API.
   *
   * @type {Boolean}
   */
  configureUpdateSwagger = false;

  /**
   * Determine that need to "delete" API.
   *
   * @type {Boolean}
   */
  configureDeleteSwagger = false;

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return [
      new Text('id')
        .throughPath()
        .primaryKey()
        .hideWhenCreation()
        .filterable()
        .sortable(),
      new Text('from').filterable().sortable(),
      new Text('to').filterable().sortable(),
      new Text('custom').filterable().sortable(),
      new Text('status').filterable().sortable(),
      new DateTime('dlr_date').filterable().sortable(),
      new DateTime('sms_date').filterable().sortable(),
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
