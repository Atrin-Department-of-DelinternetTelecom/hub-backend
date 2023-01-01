//@ts-check
'use strict';

const SuspendingActionFields = require('./fields/SuspendingAction');
const Resource = require('@lib/crud/Resource');
const { system, intranet } = require('@models');
const {
  handle: ProcessScheduledSuspensions,
} = require('@api/service/intranet/Actions/ProcessScheduledSuspensions');
const moment = require('moment');
const { CELL_PROVIDER_CODE } = require('@api/constants/contracts');
const { provider } = require('@api/service/intranet/Contract/helpers');
const { Aire } = require('@lib/sdk');
const {
  GfContractDataCell,
} = require('@api/models/intranet/intranet_gf_contract_data_cell');
const assert = require('node:assert');
const { sleep } = require('@api/utils/helpers');
const {
  DelinternetStorage,
} = require('@api/service/documents/storages/DelinternetStorage');
const { SUSPENDING_STATE } = require('@api/constants/statuses');
const ProceedSuspension = require('./actions/ProceedSuspension');

module.exports = class SuspendingAction extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: system.User,
      required: false,
      attributes: [
        'id',
        'first_name',
        'last_name',
        'username',
        'email',
        'gf_user_id',
        'crm_user_id',
        'user_id',
      ],
    },
    { model: system.SuspendingReason, required: false },
    {
      model: intranet.GfContract,
      required: false,
      attributes: [
        'id',
        'reference',
        'alias',
        'clientId',
        'feeGroupId',
        'state',
        'userId',
      ],
      include: [
        {
          model: intranet.GfClient,
          as: 'client',
          required: false,
          attributes: [
            'id',
            'active',
            'userId',
            'fiscalId',
            'name',
            'contactName',
            'contactFamilyName1',
            'contactFamilyName2',
            'emailAddress',
          ],
        },
        {
          model: intranet.GfFeeGroup,
          attributes: ['name', 'internalName', 'id'],
          as: 'fee_group',
          include: [
            {
              model: intranet.GfSection,
              as: 'sections',
              required: false,
              attributes: ['code'],
            },
          ],
          required: false,
        },
      ],
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array<Field>}
   */
  fields(request) {
    return new SuspendingActionFields().fields(request);
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return system.SuspendingAction;
  }

  async created(request, model) {
    const serviceProvider = await provider(model.gf_contract_id);

    if (serviceProvider === CELL_PROVIDER_CODE.AIRE) {
      await this.requestAireTermination(model, request.user);
    } else if (
      model.suspend_at === null ||
      moment(model.suspend_at).isSameOrBefore(moment())
    ) {
      await this.resumeSuspension(model);
    }
  }

  async requestAireTermination(model, user) {
    /// request documents
    const dataCell = await GfContractDataCell.findByContractId(
      model.gf_contract_id,
    );
    assert(dataCell?.number, 'No data cell number found!');
    console.error(await Aire.requestLineTermination(dataCell?.number));
    // wait to process applying on he provider
    await sleep(2000);
    const request = await Aire.RequestLine.findOne({
      telefono: dataCell.number,
      tipo: 'BAJA',
      ordenacion: true,
    });

    const document = await DelinternetStorage.create(
      'Documents-AireLineTermination',
      user.id,
    );
    await model.update({
      state: SUSPENDING_STATE.SIGNING,
      doc_id: document.id,
      provider_tracking_code: request?.cod,
    });
  }

  async resumeSuspension(model) {
    const { errors } = await ProcessScheduledSuspensions([model]);

    if (errors.length > 0) {
      throw errors[0];
    }

    await model.update({
      suspend_at: moment().toDate(),
      suspended_at: moment().toDate(),
      state: SUSPENDING_STATE.DONE,
    });
  }

  actions() {
    return [new ProceedSuspension()];
  }
};
