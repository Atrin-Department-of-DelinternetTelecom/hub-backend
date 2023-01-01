//@ts-check
'use strict';

const DateTime = require('@lib/crud/Fields/DateTime');
const Enum = require('@lib/crud/Fields/Enum');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');
const { Op } = require('sequelize');
const Json = require('@lib/crud/Fields/Json');
const { ASSIGNABLE } = require('@api/constants/statuses');

module.exports = class extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return [
      new ID(),

      new Enum('Type')
        .sortable()
        .filterable()
        .creationRules('required')
        .rules('in:ip,landline')
        .options({ ip: 'IP', landline: 'Landline' })
        .default('landline'),

      new TextField('Value')
        .help('exampl: 6666666')
        .sortable()
        .filterable()
        .required()
        .creationRules('required')
        .rules(async (value = null, attribute, fail) => {
          const found = await request
            .resource()
            .model()
            .findOne({
              where: {
                value,
                type: request.input('type'),
                id: { [Op.not]: request.route('id') },
              },
            });

          if (found) fail('Value already exists.');
        })
        .default(''),

      new Enum('State')
        .sortable()
        .filterable()
        .required()
        .creationRules('required')
        .rules('in:' + Object.values(ASSIGNABLE).join(','))
        .default(ASSIGNABLE.ASSIGNABLE)
        .options({
          [ASSIGNABLE.ASSIGNABLE]: 'Assignable',
          [ASSIGNABLE.ASSIGNED]: 'Assigned',
          [ASSIGNABLE.RESERVED]: 'Reserved',
        }),

      new NumberField('Creator Id')
        .nullable()
        .fillUsing((request, model, attribute) => {
          model.setDataValue(
            attribute,
            request.input(attribute) || request.user.userId,
          );
        }),

      new NumberField('Contract Id')
        .hideOnSequelize()
        .sortable()
        .filterable()
        .rules(
          'requiredIf:state,' + ASSIGNABLE.ASSIGNED,
          'existsOnIntranet:GfContract',
        ),

      new DateTime('Creation Date', 'created_at').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updated_at').exceptOnForms().nullable(),

      new Json('Contract')
        .exceptOnForms()
        .hideOnSequelize()
        .resolveUsing((value, resource) => {
          if (resource.state === ASSIGNABLE.ASSIGNED) {
            return resource.AssignableHistories?.[0]?.GfContract || null;
          }
          // resource already is free to assigne
          return null;
        }),

      new TextField('Note')
        .hideOnSequelize()
        .default('')
        .fillUsing(() => {})
        .rules((value, attribute, fail) => {
          const state = request.input('state');
          // force user to add note after change state
          if (
            state === ASSIGNABLE.ASSIGNED &&
            request.findResource().state !== state
          ) {
            fail('Note is required');
          }
        })
        .resolveUsing((value, resource) => {
          if (this.state === ASSIGNABLE.ASSIGNED) {
            return resource.AssignableHistories?.[0]?.note || null;
          }
          return null;
        }),
    ];
  }
};
