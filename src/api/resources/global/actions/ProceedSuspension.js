//@ts-check
'use strict';

const { SUSPENDING_STATE } = require('@api/constants/statuses');
const { errors } = require('@api/http/http_errors');
const { intranet } = require('@api/models');
const { getPdf } = require('@api/service/documents/DocumentService');
const Action = require('@lib/crud/Action');
const { Aire } = require('@lib/sdk');
const assert = require('node:assert');
const {
  handle: ProcessScheduledSuspensions,
} = require('@api/service/intranet/Actions/ProcessScheduledSuspensions');
const moment = require('moment');

module.exports = class ProceedSuspension extends Action {
  constructor() {
    super();
    this.direct();
  }

  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param fields {{iban: string, bic: string, bank: string}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const suspendingAction = models[0];

    const [client, { pdf, fileName }] = await Promise.all([
      this.getTargetClient(suspendingAction.gf_contract_id),
      getPdf(`del:${suspendingAction.doc_id}`),
    ]);

    // first we had to upload the signed document to AIRE service
    await Aire.uploadDocument({
      subscriberType: client.subscriberType.aireNetworksCode,
      fiscalId: client.fiscalId,
      aireRequestCode: suspendingAction.provider_tracking_code,
      documentType: 'BAJA',
      file: pdf,
      fileName,
    });
    // then mark process as waiting for provider
    await this.resumeSuspension(suspendingAction);
  }

  async getTargetClient(contractId) {
    const contract = await intranet.GfContract.findByPk(contractId, {
      include: [
        {
          model: intranet.GfClient,
          as: 'client',
          include: [{ model: intranet.GfSubscriberType, as: 'subscriberType' }],
        },
      ],
    });
    // prevent change holder for inactive client
    assert(contract, new errors.BadRequest('Target contract not found'));
    // prevent change holder for inactive client
    assert(contract.client, new errors.BadRequest('Target client not found'));

    return contract.client;
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
};
