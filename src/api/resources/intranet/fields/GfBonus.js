//@ts-check
'use strict';

const DateTime = require('@lib/crud/Fields/DateTime');
const Decimal = require('@lib/crud/Fields/Decimal');
const Enum = require('@lib/crud/Fields/Enum');
const ID = require('@lib/crud/Fields/ID');
const ArrayField = require('@lib/crud/Fields/Array');
const models = require('@models');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const Textarea = require('@lib/crud/Fields/Textarea');
const TextField = require('@lib/crud/Fields/Text');
const UID = require('@lib/crud/Fields/UID');

module.exports = class GfBonus extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {any[]}
   */
  fields(request) {
    return [
      new ID(),

      new UID('UID', 'uid'),

      new TextField('Name')
        .help('exampl: My Name')
        .sortable()
        .filterable()
        .required()
        .rules('required')
        .default(''),

      new TextField('Internal Name', 'internalName')
        .help('exampl: My internal name')
        .sortable()
        .filterable()
        .required()
        .rules('required')
        .default(''),

      new NumberField('Section Id', 'sectionId')
        .sortable()
        .filterable()
        .required()
        .rules('required', async (value, attribute, fail) => {
          const Model = models.intranet.GfSection;
          const section = await Model.findByPk(value);

          if (section === null) {
            fail(`${Model.name} with id:${value} not found.`);
          }
        }),

      new TextField('Provider Code', 'providerCode').nullable().default(''),
      new TextField('TPV Code', 'tpvCode').nullable().default(''),
      new NumberField('Auto Renew', 'autoRenew').nullable().default(0),
      new NumberField('Prorotable').nullable().default(0),
      new NumberField('Acumulative').nullable().default(0),

      new NumberField('Require Technical Action', 'requireTechnicalAction')
        .nullable()
        .default(0),

      new Textarea('Description').nullable().default(''),
      new Decimal('PVP', 'pvp')
        .length(11, 4)
        .nullable()
        .default(0.0)
        .filterable()
        .sortable(),
      new Decimal('Linea Percentage', 'lineaPercentage')
        .length(5, 2)
        .nullable()
        .default(0.0),

      new Enum('Technology Analitic', 'technologyAnalitic')
        .sequelize('type', 'enum')
        .nullable()
        .default('')
        .options({
          ADSL: 'ADSL',
          BONOSRAROS: 'BONOSRAROS',
          RADIO: 'RADIO',
          FIXBONUS: 'FIXBONUS',
          FIBRA: 'FIBRA',
          FIBRAINTERNET: 'FIBRAINTERNET',
          PERCENTAGE: 'PERCENTAGE',
        }),

      new Enum('Percentage Rule', 'percentageRule')
        .sequelize('type', 'enum')
        .nullable()
        .default('')
        .options({
          INTERNET: 'INTERNET',
          'INTERNET+BONO': 'INTERNET+BONO',
          SLA: 'SLA',
          IP: 'IP',
          Transport: 'Transport',
          Material: 'Material',
          Tele: 'Tele',
          Bonodonacio: 'Bonodonacio',
          Bonocapex: 'Bonocapex',
          Bonofinan: 'Bonofinan',
          serveisexterns: 'serveisexterns',
          centraleta: 'centraleta',
        }),

      new NumberField('Capex Type', 'capexType')
        .nullable(['', null, 'null', 0])
        .default(0),

      new Decimal('Opex', 'opexValue').length(11, 2).nullable().default(0.0),
      new Decimal('Infra Ip', 'infraIp').length(11, 2).nullable().default(0.0),
      new Decimal('import T', 'importT').length(11, 2).nullable().default(0.0),
      new Decimal('Suport Cor', 'suportCor')
        .length(11, 2)
        .nullable()
        .default(0.0),

      new NumberField('Internet Mb Included', 'internetMbIncluded')
        .nullable()
        .default(0),

      new NumberField('Internet Up Mb Included', 'internetUpMbIncluded')
        .nullable()
        .default(0),

      new NumberField('Internet Ip Fix', 'internetIpFix').nullable().default(0),

      new NumberField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms(),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),

      new ArrayField('Fee Groups', 'feeGroups')
        .nullable()
        .default([])
        .onlyOnForms()
        .rules(async (value, attribute, fail) => {
          const Model = models.intranet.GfFeeGroup;

          for (const id of value) {
            const feeGroup = await Model.findByPk(id);

            if (feeGroup === null) {
              fail(`${Model.name} with id:${id} not found.`);
            }
          }
        })
        .fillUsing((req, model, attribute) => {
          if (!request.has(attribute)) return;

          return async (req, model, transaction) => {
            await model.setFeeGroups(req.input(attribute), {
              transaction,
            });
          };
        }),

      new ArrayField('Labels', 'labels')
        .nullable()
        .default([])
        .onlyOnForms()
        .rules(async (value, attribute, fail) => {
          const Model = models.intranet.GfBonoLabel;

          const bonoLabels = await Model.findAll({ where: { id: value } });
          const uniqueBonoLabels = [...new Set(value)];

          if (bonoLabels.length !== uniqueBonoLabels.length)
            fail(`some bono labels not found`);
        })
        .fillUsing((req, model, attribute) => {
          if (!request.has(attribute)) return;

          return async (req, model, transaction) => {
            await model.setLabels(req.input(attribute), {
              transaction,
            });
          };
        }),
    ];
  }
};
