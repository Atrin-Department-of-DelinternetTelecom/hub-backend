//@ts-check
'use strict';

const { GfClient } = require('@api/models/intranet/intranet_gf_clients');
const { TechnicianTask } = require('@api/models/technician/technician_tasks');
const BooleanField = require('@lib/crud/Fields/Boolean');
const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const Json = require('@lib/crud/Fields/Json');
const NumberField = require('@lib/crud/Fields/Number');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');
const { system, intranet } = require('@models');
const SubmitSatisfaction = require('./actions/SubmitSatisfaction');
const { Op, literal } = require('sequelize');

module.exports = class SatisfactionForm extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: TechnicianTask,
      include: [
        {
          model: GfClient,
          as: 'client',
          attributes: ['id', 'name', 'fiscalId', 'emailAddress'],
        },
        {
          model: system.User,
          as: 'technician',
          required: false,
          attributes: ['id', 'first_name', 'last_name', 'name'],
        },
        {
          model: intranet.GfContract,
          as: 'contract',
          required: false,
          attributes: ['id', 'reference', 'state'],
        },
      ],
    },
    {
      model: system.SmspubliReport,
      required: false,
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return [
      new ID(),
      new Text('form_id').exceptOnForms().filterable(),
      new NumberField('technician_task_id')
        .filterable()
        .sortable()
        .rules('required', 'existsOnSystem:TechnicianTask'),
      new BooleanField('filled')
        .default(false)
        .exceptOnForms()
        .filterable()
        .sortable(),
      new Json('answers').default({}).exceptOnForms(),
      new Json('questions').default({}).exceptOnForms(),
      new DateTime('sentAt', 'sentAt').nullable().filterable().sortable(),
      new DateTime('filledAt', 'filledAt').nullable().filterable().sortable(),
    ];
  }

  indexQuery(req, query) {
    const wheres = [];

    if (req.hasFilter('TechnicianTask.technicianUserId')) {
      wheres.push({
        '$TechnicianTask.technician_user_id$': req.filter(
          'TechnicianTask.technicianUserId',
        ).value,
      });
    }

    if (req.hasFilter('TechnicianTask.gfClientId')) {
      wheres.push({
        '$TechnicianTask.gf_client_id$': req.filter('TechnicianTask.gfClientId')
          .value,
      });
    }

    if (req.hasFilter('TechnicianTask.client.name')) {
      const value = req.filter('TechnicianTask.client.name').value;
      wheres.push({
        '$TechnicianTask.client.name$': {
          [Op.like]: `%${String(value).replaceAll('%', '')}%`,
        },
      });
    }

    if (req.hasFilter('TechnicianTask.technician.name')) {
      const value = req.filter('TechnicianTask.technician.name').value;

      wheres.push(
        literal(
          `EXISTS (SELECT 1 FROM delinternet_hub.global_users AS User WHERE User.id = TechnicianTask.technician_user_id AND CONCAT(User.first_name, ' ', User.last_name) LIKE '%${String(
            value,
          ).replaceAll('%', '')}%')`,
        ),
      );
    }

    if (req.hasFilter('TechnicianTask.type')) {
      wheres.push({
        '$TechnicianTask.type$': {
          [Op.like]: req.filter('TechnicianTask.type').value,
        },
      });
    }

    query.where = {
      ...query.where,
      [Op.and]: wheres,
    };

    return query;
  }

  possibleFilters() {
    return [
      ...super.possibleFilters(),
      'TechnicianTask.client.name',
      'TechnicianTask.technician.name',
      'TechnicianTask.technicianUserId',
      'TechnicianTask.type',
      'TechnicianTask.gfClientId',
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return system.SatisfactionForm;
  }
  /**
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [new SubmitSatisfaction().standalone()];
  }
};
