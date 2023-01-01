//@ts-check
'use strict';

const { DATA_FIX_TYPE, IVOZ_TYPE } = require('@api/constants/contracts');
const GfContractDataFixFields = require('./fields/GfContractDataFix');
const { GfContract, GfIvozFix, GfUser } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');
const {
  onAfterUpdate,
  ensureOfPortabilityDocument,
} = require('@api/service/intranet/GfContractDataFixService');
const { ActionEvent } = require('@api/models/crud/crud_action_event');
const ExecutePortability = require('./actions/ExecutePortability');
const {
  GfContractDataInternet,
} = require('@api/models/intranet/intranet_gf_contract_data_internet');
const {
  GfContractDataFix: Model,
} = require('@api/models/intranet/intranet_gf_contract_data_fix');
const { GfClient } = require('@api/models/intranet/intranet_gf_clients');
const { GfSection } = require('@api/models/intranet/intranet_gf_sections');
const { GfFeeGroup } = require('@api/models/intranet/intranet_gf_fee_groups');

module.exports = class GfContractDataFix extends Resource {
  /**
   * Determine that need to creation API.
   *
   * @type {Boolean}
   */
  configureCreateSwagger = false;

  /**
   * Determine that need to delete API.
   *
   * @type {Boolean}
   */
  configureDeleteSwagger = false;

  /**
   * Eager loaded relation ships.
   *
   * @type {any[]}
   */
  include = [
    {
      model: GfContract,
      as: 'contract',
      required: false,
    },
    {
      model: GfIvozFix,
    },
    {
      model: GfContract,
      as: 'internetSection',
      required: false,
      include: [
        {
          model: GfFeeGroup,
          as: 'fee_group',
          include: {
            model: GfSection,
            as: 'sections',
            required: false,
          },
          required: false,
        },
        {
          model: GfClient,
          as: 'client',
          required: false,
        },
      ],
    },
    {
      model: GfContractDataInternet,
      as: 'dataInternet',
      required: false,
    },
    {
      model: GfUser,
      as: 'technician',
      required: false,
    },
    {
      model: GfUser,
      as: 'operator',
      required: false,
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return array
   */
  fields(request) {
    return new GfContractDataFixFields().fields(request);
  }

  model() {
    return Model;
  }

  actions() {
    return [new ExecutePortability().inline()];
  }

  /**
   * Dispatch saved event.
   *
   * @param {Object} request
   * @param {Model} model
   * @return {Promise<void>}
   */
  async saved(request, model) {
    const [ivoz] = await GfIvozFix.findOrCreate({
      where: { contractId: model.contractId },
    });

    new GfContractDataFixFields()
      .ivozFields(request)
      .map((field) => field.fill(request, ivoz));

    ivoz.set(
      'type',
      model.type === DATA_FIX_TYPE.COMPANY
        ? IVOZ_TYPE.RESIDENTIAL
        : IVOZ_TYPE.HOME,
    );

    ivoz.set('extension', model.number);
    await ActionEvent.forResourceUpdate({
      payload: request.all(),
      resource: ivoz,
      userId: request.userId(),
    }).markAsFinished();

    await ivoz.save();
  }
  /**
   *
   * @param {*} request
   * @param {Model} model
   */
  async updated(request, model) {
    // ensure document generate for portability
    await ensureOfPortabilityDocument(model.contractId);
    // then execute
    await onAfterUpdate(model, request.user, new Model(model.previous()));
  }
};
