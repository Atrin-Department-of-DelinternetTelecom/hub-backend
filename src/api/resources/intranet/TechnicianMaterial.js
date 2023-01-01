'use strict';

const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const Text = require('@lib/crud/Fields/Text');
const DecimalField = require('@lib/crud/Fields/Decimal');
const Resource = require('@lib/crud/Resource');
const { system } = require('@models');
const BooleanField = require('@lib/crud/Fields/Boolean');
const { Sequelize } = require('sequelize');

module.exports = class TechnicianMaterial extends Resource {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return [
      new ID(),
      new Text('title').filterable().sortable(),
      new Text('unit').nullable().filterable().sortable(),
      new BooleanField('active').filterable().sortable(),
      new DecimalField('unit price', 'unitPrice')
        .nullable()
        .filterable()
        .sortable(),
      new DateTime('deleted at', 'deletedAt').exceptOnForms(),
      new DateTime('created at', 'createdAt').exceptOnForms(),
      new DateTime('updated at', 'updatedAt').exceptOnForms(),
    ];
  }
  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return system.TechnicianMaterial;
  }
  creating(req, model) {
    console.log(model);
  }

  /**
   * Prepare resource for swager config.
   *
   * @return Object
   */
  indexQuery(req, query = {}) {
    query.attributes = {
      include: [
        [
          Sequelize.literal(`(
              SELECT COUNT(*)
              FROM installation_report_materials
              WHERE installation_report_materials.material_id = TechnicianMaterial.id
            )`),
          'usageCount',
        ],
      ],
    };
    return query;
  }

  uriKey() {
    return 'technician-materials';
  }
};
