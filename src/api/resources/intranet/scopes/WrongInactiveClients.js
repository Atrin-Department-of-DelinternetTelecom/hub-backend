//@ts-check
'use strict';
const GfClientFields = require('../fields/GfClient');
const {
  intranet: { Country, GfContract, InvoiceClientsExtraField, GfUser },
} = require('@models');
const Scope = require('@lib/crud/Scope');
const { CONTRACT } = require('@api/constants/statuses');

module.exports = class WrongInactiveClients extends Scope {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Object} query
   * @return {Object}
   */
  query(request, query) {
    query.include = [
      {
        model: InvoiceClientsExtraField,
        as: 'extraFields',
        required: false,
        attributes: ['name', 'id'],
        raw: true,
      },
      {
        model: Country,
        as: 'nationality',
        required: false,
        attributes: ['id', 'name', 'isoCode'],
        raw: true,
      },
      {
        model: GfUser,
        as: 'user',
        required: false,
        attributes: ['id', 'name', 'email', 'userId'],
        raw: true,
      },
      {
        model: GfContract,
        as: 'contracts',
        required: true,
        where: { state: [CONTRACT.ACTIVE, CONTRACT.BLOCKED] },
        attributes: ['id', 'state', 'reference'],
      },
    ];

    if (!query.where) {
      query.where = {};
    }

    query.where.active = 0;

    return query;
  }

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array}
   */
  fields(request) {
    return new GfClientFields().fields(request);
  }
};
