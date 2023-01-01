//@ts-check
'use strict';
const BooleanField = require('@lib/crud/Fields/Boolean');
const DateTime = require('@lib/crud/Fields/DateTime');
const EnumField = require('@lib/crud/Fields/Enum');
const ID = require('@lib/crud/Fields/ID');
const JsonField = require('@lib/crud/Fields/Json');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const SelectField = require('@lib/crud/Fields/Select');
const TextField = require('@lib/crud/Fields/Text');
const UID = require('@lib/crud/Fields/UID');

module.exports = class GfContractDocument extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),

      new UID('UID', 'uid'),

      new NumberField('Contract', 'contractId')
        .required()
        .filterable()
        .sortable()
        .creationRules('required')
        .rules('existsOnIntranet:GfContract'),

      new NumberField('Client', 'clientId')
        .required()
        .filterable()
        .sortable()
        .creationRules('required')
        .rules('existsOnIntranet:GfClient'),

      new SelectField('Type')
        .nullable()
        .filterable()
        .sortable()
        .default('')
        .options({
          DOCUMENTO: 'Aire Documento',
          PORTABILIDAD: 'Aire Portabilidad',
          CONTRATO: 'Aire Contrato',
          OTROS: 'Aire Otros',
          generic: 'Generic',
        }),

      new JsonField('Historic Sents', 'historicSents').nullable(),

      new TextField('Aire Codigo Solicitud', 'aireCodigoSolicitud')
        .nullable()
        .filterable()
        .sortable(),

      new BooleanField('Sent')
        .swagger('type', 'number')
        .default(0)
        .filterable()
        .sortable()
        .exceptOnForms(),

      new NumberField('Document', 'clientDocId')
        .filterable()
        .sortable()
        .required()
        .rules('existsOnIntranet:GfClientDocument'),

      new EnumField('Used For', 'usedFor')
        .filterable()
        .options({ cahngeHolder: 'Change Holder' })
        .default('changeHolder'),

      new NumberField('Used For Id', 'usedForId')
        .required()
        .creationRules('required')
        .filterable()
        .sortable(),

      new TextField('Alias').nullable().filterable().sortable(),

      new TextField('File').nullable(),

      new BooleanField('Is Client Doc?', 'isClientDoc')
        .swagger('type', 'number')
        .default(1)
        .filterable()
        .sortable()
        .exceptOnForms(),

      new BooleanField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms(),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),
    ];
  }
};
