//@ts-check
'use strict';

const BooleanField = require('@lib/crud/Fields/Boolean');
const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const TextField = require('@lib/crud/Fields/Text');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const UID = require('@lib/crud/Fields/UID');
const { literal } = require('sequelize');
const { intranet: knex } = require('@lib/knex');

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

module.exports = class GfContractHolderChange extends ResolvesFields {
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
        .nullable()
        .sortable()
        .filterable(),

      new NumberField('Contract')
        .onlyOnIndex()
        .resolveUsing((value, resource, attribute) => resource.contract)
        .filterable(function (req, query, filter, operator, mergeCondition) {
          return {
            contractId:
              typeof filter === 'string'
                ? { [this.guessSequelizeOperator(operator)]: filter }
                : literal(
                    `EXISTS (${subQuery(
                      filter,
                      'gf_contracts',
                      'contractId',
                    ).toQuery()})`,
                  ),
          };
        }),

      new NumberField('From Client', 'fromClientId')
        .nullable()
        .sortable()
        .filterable(),

      new NumberField('From Client', 'fromClient')
        .onlyOnIndex()
        .resolveUsing((value, resource, attribute) => resource.fromClient)
        .filterable(function (req, query, filter, operator, mergeCondition) {
          return {
            fromClientId:
              typeof filter === 'string'
                ? { [this.guessSequelizeOperator(operator)]: filter }
                : literal(
                    `EXISTS (${subQuery(
                      filter,
                      'gf_clients',
                      'fromClientId',
                    ).toQuery()})`,
                  ),
          };
        }),

      new NumberField('To Client', 'toClientId')
        .nullable()
        .sortable()
        .filterable(),

      new TextField('provider_tracking_code')
        .nullable()
        .sortable()
        .filterable(),

      new NumberField('To Client', 'toClient')
        .onlyOnIndex()
        .resolveUsing((value, resource, attribute) => resource.toClient)
        .filterable(function (req, query, filter, operator, mergeCondition) {
          return {
            toClientId:
              typeof filter === 'string'
                ? { [this.guessSequelizeOperator(operator)]: filter }
                : literal(
                    `EXISTS (${subQuery(
                      filter,
                      'gf_clients',
                      'toClientId',
                    ).toQuery()})`,
                  ),
          };
        }),

      new DateTime('Change Date', 'changeDate').nullable(),

      new TextField('State').nullable().filterable().default('inProgress'),

      new TextField('State Option', 'stateOption').nullable().filterable(),

      new BooleanField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms(),

      new NumberField('Doc Id', 'docId')
        .resolveUsing((/** @type {number} */ value) => `del:${value}`)
        .nullable(),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),
    ];
  }
};
