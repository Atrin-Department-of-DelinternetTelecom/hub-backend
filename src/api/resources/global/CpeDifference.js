//@ts-check
'use strict';

const BooleanField = require('@lib/crud/Fields/Boolean');
const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');
const { system, intranet } = require('@models');
const LookupCpe = require('./actions/LookupCpe');

const { intranet: knex } = require('@lib/knex');
const { literal } = require('sequelize');
const Json = require('@lib/crud/Fields/Json');

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
module.exports = class CpeDifference extends Resource {
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
      new Text('serial_number').sortable().filterable(),
      new Text('device_id').sortable().filterable(),
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
      new BooleanField('is_configured').sortable().filterable(),
      new BooleanField('need_factory_reset').sortable().filterable(),
      new BooleanField('has_credential_error').sortable().filterable(),
      new Json('hints')
        .exceptOnForms()
        .hideOnSequelize()
        .resolveUsing(() => this.hints())
        .swagger('properties', {
          has_credential_error: {
            type: 'string',
          },
          need_factory_reset: {
            type: 'string',
          },
          is_configured: {
            type: 'string',
          },
        }),
      new Json('errors')
        .exceptOnForms()
        .hideOnSequelize()
        .resolveUsing(() => this.errors())
        .swagger('properties', {
          has_credential_error: {
            type: 'string',
            example: 'MISMATCH_MODEL_CREDENTIAL',
          },
          need_factory_reset: {
            type: 'string',
            example: 'MISMATCH_RADIUS_CREDENTIAL',
          },
          is_configured: {
            type: 'string',
            example: 'ACS_CONNECTION_FAILED|MISSING_CONTRACT',
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
    return system.CpeDifference;
  }

  /**
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [new LookupCpe().inline()];
  }

  hints() {
    // Define the base hints
    const hints = {
      has_credential_error:
        'The local cpeWifiSsid and cpeWifiPassword do not match the ACS service. You may need to update the local contract.',
      need_factory_reset:
        'The local nodeRadiusName and nodeRadiusPassword do not match the ACS service. Consider running a factory reset.',
      is_configured: 'The ACS connection has a corresponding local contract.',
    };

    // Modify hints based on conditions
    if (!this.resource.is_configured) {
      hints.is_configured = this.resource.gf_contract_id
        ? 'The contract is not connected to the ACS service.'
        : 'The ACS connection does not have a corresponding local contract.';
    }

    return hints;
  }

  errors() {
    return {
      has_credential_error: 'MISMATCH_MODEL_CREDENTIAL',
      need_factory_reset: 'MISMATCH_RADIUS_CREDENTIAL',
      is_configured: this.resource.gf_contract_id
        ? 'ACS_CONNECTION_FAILED'
        : 'MISSING_CONTRACT',
    };
  }
};
