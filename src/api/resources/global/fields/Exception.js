//@ts-check
'use strict';

const DateField = require('@lib/crud/Fields/DateTime');
const Enum = require('@lib/crud/Fields/Enum');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const JsonField = require('@lib/crud/Fields/Json');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');

module.exports = class Exception extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    const fromException = (attribute, model) => {
      return model.exception[attribute] ?? null;
    };

    const fillException = (value, attribute, model) => {
      model.set('exception', {
        ...model.exception,
        [attribute]: value,
      });
    };

    const fromRequest = (attribute, model) => {
      return model.request[attribute] ?? null;
    };

    const fillRequest = (value, attribute, model) => {
      model.set('request', {
        ...model.request,
        [attribute]: value,
      });
    };

    return [
      new ID(),

      new JsonField('Exception').nullable().sortable().filterable().default({}),

      new JsonField('Request').nullable().default({}),

      new NumberField('User Id', 'userId')
        .nullable()
        .sortable()
        .filterable()
        .default(0),

      new Enum('State').default('pending').sortable().filterable().options({
        pending: 'Pending',
        fixed: 'Fixed',
        inprogress: 'Inprogress',
        ignored: 'Ingored',
      }),

      new Enum('error_origin', 'error_origin')
        .default('backend')
        .sortable()
        .filterable()
        .options({ backend: 'backend', front: 'front' })
        .nullable(),

      new TextField('Message').nullable().virtual(fromException, fillException),

      new TextField('Stack').nullable().virtual(fromException, fillException),

      new TextField('Path').nullable().virtual(fromRequest, fillRequest),

      new TextField('Method').nullable().virtual(fromRequest, fillRequest),

      new TextField('Body').nullable().virtual(fromRequest, fillRequest),

      new TextField('Payload').nullable().virtual(fromRequest, fillRequest),

      new DateField('Created At', 'created_at')
        .nullable()
        .sortable()
        .filterable()
        .hideOnForms(),
    ];
  }
};
