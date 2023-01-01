//@ts-check
'use strict';
const Action = require('@lib/crud/Action');
const GfClientService = require('@service/intranet/GfClientService');
const {
  default: ValidationException,
} = require('@lib/crud/Exceptions/ValidationException');

const ClientSepa = require('@service/intranet/GfClientSepa');

const {
  handle: MeiliSearchClientSync,
} = require('@api/service/intranet/Actions/MeiliSearchClientSync');
const { ActionEvent } = require('@api/models/crud/crud_action_event');
const { isNullish } = require('@api/utils/helpers');
const { default: to } = require('await-to-js');

const { GfClient } = require('@api/models').intranet;

/** @type {Record<string, string>} */
const requiredKeys = {
  fiscalId: 'Fiscal ID',
  bic: 'BIC',
  // bicName: 'BIC Name',
  subscriberTypeId: 'Subscriber Type ID',
  documentTypeId: 'Document Type ID',
  contactPhone: 'Contact Phone',
  addressNumber: 'Address Number',
  document: 'Upload identity document',
};

module.exports = class ActivateClient extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {Object} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    models.forEach(this.#validateClient);

    const results = await Promise.allSettled(
      models.map(async (model) => {
        const client = await GfClient.findByPk(model.id);
        await model.update({ active: 1 });

        // @ts-ignore
        await ClientSepa.createIfNeeded(model.id, request.user?.id ?? 1);

        ActionEvent.forResourceUpdate({
          payload: request.all(),
          userId: request.userId(),
          resource: model,
          original: client,
        }).markAsFinished();

        return model;
      }),
    );

    Promise.all(models.map((model) => GfClientService.ensureOfDocument(model)));
    // update meilie search
    const [error] = await to(MeiliSearchClientSync(models.map(({ id }) => id)));
    if (error) console.error(error);

    return results;
  }

  #validateClient(model) {
    for (const [key, label] of Object.entries(requiredKeys)) {
      if (!model.isRemitance && ['bic', 'bicName'].includes(key)) continue;
      ValidationException.throwUnless(
        !isNullish(model[key]),
        `${label} is required`,
      );
    }

    ValidationException.throwUnless(
      model.dontHaveEmail || model.emailAddress,
      'Email Address is required',
    );
  }
};
