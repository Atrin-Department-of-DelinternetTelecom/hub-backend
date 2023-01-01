//@ts-check
'use strict';

const { GfCollaborator: Model } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const TextField = require('@lib/crud/Fields/Text');
const BooleanField = require('@lib/crud/Fields/Boolean');

module.exports = class GfCollaborator extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),
      new TextField('name')
        .help('exampl: My Name')
        .sortable()
        .filterable()
        .required()
        .rules('required')
        .default(''),
      new BooleanField('master')
        .sortable()
        .filterable()
        .default(false)
        .nullable(),
      new NumberField('comisionista')
        .sortable()
        .filterable()
        .default(0)
        .nullable(),
      new NumberField('comissionPercentage', 'comissionPercentage')
        .default(0)
        .nullable(),
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
