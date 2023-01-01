//@ts-check
'use strict';
const AssignableFields = require('./fields/Assignable');
const { Assignable: Model, AssignableHistory } = require('@models').system;
const CreateAssignableIpByRange = require('./actions/CreateAssignableIpByRange');
const { GfContract } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');
const { ASSIGNABLE, ASSIGNABLE_HISTORY } = require('@api/constants/statuses');

module.exports = class Assignable extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: AssignableHistory,
      where: { action_type: ASSIGNABLE_HISTORY.ASSIGNED },
      limit: 1,
      required: false,
      include: { model: GfContract, required: false },
      order: [['id', 'desc']],
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return new AssignableFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return Model;
  }

  /**
   * Dispatch saved event.
   *
   * @param {Object} request
   * @param {import('@models').AnyModel} model
   * @return {Promise<void>}
   */
  async saved(request, model) {
    const lastAssigned = await AssignableHistory.findOne({
      order: [['id', 'desc']],
    });

    if (
      !model.changed('state') &&
      model.state === ASSIGNABLE.ASSIGNED &&
      lastAssigned.contract_id === request.input('contract_id')
    ) {
      return;
    }

    const attributes = {
      note: request.input('note'),
      operator_id: request.user.id,
      assignable_id: model.id,
      action_type:
        model.state === ASSIGNABLE.ASSIGNABLE
          ? ASSIGNABLE_HISTORY.REALEASED
          : model.state,
    };

    if (request.has('contract_id')) {
      attributes.contract_id = request.input('contract_id');
    }

    await AssignableHistory.create(attributes);
  }

  /**
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [new CreateAssignableIpByRange().standalone()];
  }
};
