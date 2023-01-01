//@ts-check
'use strict';

const ID = require('@lib/crud/Fields/ID');
const { GfIncidence: Model } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');
const NumberField = require('@lib/crud/Fields/Number');
const Text = require('@lib/crud/Fields/Text');
const BooleanField = require('@lib/crud/Fields/Boolean');
const DateTime = require('@lib/crud/Fields/DateTime');

module.exports = class GfIncidence extends Resource {
  /**
   * Prevent to configure swagger for `CRUD`.
   *
   * @type {Boolean}
   */
  preventSwagger = true;

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),

      new NumberField('client', 'clientId').nullable().sortable().filterable(),
      new NumberField('contract', 'contractId')
        .nullable()
        .sortable()
        .filterable(),
      new NumberField('event', 'motherEventId')
        .nullable()
        .sortable()
        .filterable(),
      new NumberField('user', 'userId').nullable().sortable().filterable(),
      new Text('description'),
      new BooleanField('closed').default(false).sortable().filterable(),
      new Text('file1').nullable(),
      new Text('file2').nullable(),
      new Text('file3').nullable(),
      new Text('file4').nullable(),
      new Text('file5').nullable(),
      new Text('file6').nullable(),
      new Text('sectionCode', 'sectionCode').nullable(),
      new DateTime('date').nullable().sortable().filterable(),
      new DateTime('executedDate', 'executedDate')
        .nullable()
        .sortable()
        .filterable(),
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
    return Model;
  }
};
