//@ts-check
'use strict';

const BooleanField = require('@lib/crud/Fields/Boolean');
const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');
const { system, intranet } = require('@models');
const LookupIvoz = require('./actions/LookupIvoz');
const Json = require('@lib/crud/Fields/Json');
const { intranet: knex } = require('@lib/knex');
const { literal } = require('sequelize');

const subQuery = (filter, table, foreignKey) => {
  const ref = table + '@' + Date.now();
  const subQuery = knex(`intranet.${table} AS ${ref}`)
    .select(1)
    .limit(1)
    .where(`${ref}.status`, '=', 1)
    .where(`${ref}.id`, '=', knex.raw(foreignKey));

  Object.keys(filter).forEach((key) => {
    subQuery.where(`${ref}.${key}`, filter[key].operator, filter[key].value);
  });

  return subQuery;
};

module.exports = class IvozDifference extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [{ model: intranet.GfContract, required: false }];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return [
      new ID(),
      new Text('extension').sortable().filterable(),
      new BooleanField('is_configured').sortable().filterable(),
      new BooleanField('has_valid_state').sortable().filterable(),
      new NumberField('gf_contract_id').sortable().filterable(),
      new Json('GfContract', 'GfContract')
        .help('Only search contract')
        .onlyOnIndex()
        .filterable(function (req, query, filter, operator) {
          return {
            gf_contract_id: literal(
              `EXISTS (${subQuery(
                filter,
                'gf_contracts',
                'gf_contract_id',
              ).toQuery()})`,
            ),
          };
        }),
      new BooleanField('is_active').sortable().filterable(),
      new Json('hints')
        .exceptOnForms()
        .hideOnSequelize()
        .resolveUsing(() => this.hints())
        .swagger('properties', {
          is_configured: { type: 'string' },
          has_valid_state: { type: 'string' },
        }),
      new Json('errors')
        .exceptOnForms()
        .hideOnSequelize()
        .resolveUsing(() => this.errors())
        .swagger('properties', {
          is_configured: {
            type: 'string',
            example: 'WRONG_STATE|EXTRA_CONNECTION',
          },
          has_valid_state: {
            type: 'string',
            example: 'IVOZ_CONNECTION_FAILED|MISSING_CONTRACT',
          },
        }),
      new DateTime('created_at')
        .resolveUsing((value, resource) => resource.get('createdAt'))
        .sortable()
        .filterable()
        .exceptOnForms(),
      new DateTime('updated_at')
        .resolveUsing((value, resource) => resource.get('updatedAt'))
        .sortable()
        .filterable()
        .exceptOnForms(),
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return system.IvozDifference;
  }

  /**
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [new LookupIvoz().inline()];
  }

  hints() {
    // Define the initial hints with their default messages
    const hints = {
      is_configured: 'The IVOZ connection has a corresponding local contract.',
      has_valid_state:
        'The IVOZ connection and local contract are in the same state.',
    };

    // Update the "is_configured" hint based on conditions
    if (!this.resource.is_configured) {
      hints.is_configured = this.resource.gf_contract_id
        ? 'The local contract is not connected to IVOZ.'
        : 'No corresponding local contract found for the IVOZ connection.';
    }

    // Update the "has_valid_state" hint based on conditions
    if (!this.resource.has_valid_state) {
      hints.has_valid_state = this.resource.is_active
        ? 'The local contract should be activated.'
        : 'The IVOZ connection should be inactivated.';
    }

    return hints;
  }

  errors() {
    return {
      has_valid_state: this.resource.is_active
        ? 'WRONG_STATE'
        : 'EXTRA_CONNECTION',
      is_configured: this.resource.gf_contract_id
        ? 'IVOZ_CONNECTION_FAILED'
        : 'MISSING_CONTRACT',
    };
  }
};
