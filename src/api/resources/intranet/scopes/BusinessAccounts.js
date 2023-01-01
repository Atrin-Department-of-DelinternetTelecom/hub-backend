//@ts-check
'use strict';
const config = require('@config');
const GfClientFields = require('./../fields/GfClient');
const {
  intranet: { Country, GfSubscriberType, InvoiceClientsExtraField, GfUser },
} = require('@models');
const Scope = require('@lib/crud/Scope');

module.exports = class BusinessAccounts extends Scope {
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
        model: GfSubscriberType,
        as: 'subscriberType',
        required: true,
        where: {
          aireNetworksCode: config.get('intranet.aireBusinessCode') ?? 1,
        },
      },
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
    ];

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
