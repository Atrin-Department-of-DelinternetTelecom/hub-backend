//@ts-check
'use strict';

const { GfContract, GfClient } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');
const ID = require('@lib/crud/Fields/ID');
const Text = require('@lib/crud/Fields/Text');
const { Op, literal } = require('sequelize');
const { intranet: knex } = require('@lib/knex');
const Enum = require('@lib/crud/Fields/Enum');
const { CONTRACT } = require('@api/constants/statuses');
const { associateBy } = require('@api/utils/collections');
const GenerateDocuments = require('./actions/GenerateDocuments');

module.exports = class MissingDocument extends Resource {
  configureViewSwagger = false;
  configureCreateSwagger = false;
  configureUpdateSwagger = false;
  configureDeleteSwagger = false;

  include = [
    {
      model: GfClient,
      as: 'client',
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID().sortable().filterable(),
      new Text('reference').sortable().filterable(),
      new Enum('state')
        .options(associateBy(Object.values(CONTRACT), (val) => val))
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
    return GfContract;
  }

  /**
   * Build a "index" query for the given resource.
   *
   * @param {any} req
   * @param {{where: Record<any,any>}} query
   * @return {Object}
   */
  indexQuery(req, query) {
    const ref = 'gf_docs@' + Date.now();
    const subQuery = knex(`intranet.gf_docs AS ${ref}`)
      .select(1)
      .limit(1)
      .where(`${ref}.status`, '=', 1)
      .where(`${ref}.contractId`, '=', knex.raw('`GfContract`.`id`'));

    query.where = {
      ...query.where,
      [Op.and]: [literal(`NOT EXISTS (${subQuery.toQuery()})`)],
    };

    return query;
  }
  /**
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [new GenerateDocuments().standalone()];
  }
};
