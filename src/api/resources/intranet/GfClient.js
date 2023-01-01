//@ts-check
'use strict';
const ActivateClient = require('./actions/ActivateClient');
const { Country } = require('@models').intranet;
const DeactivateClient = require('./actions/DeactivateClient');
const { GfClient: Model } = require('@models').intranet;
const GfClientFields = require('./fields/GfClient');
const { GfContract } = require('@models').intranet;
const { GfContractDataCell } = require('@models').intranet;
const { GfContractDataFix } = require('@models').intranet;
const { GfContractDataInternet } = require('@models').intranet;
const { GfFeeGroup } = require('@models').intranet;
const { GfSection } = require('@models').intranet;
const { InvoiceClientsExtraField } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');
const BusinessAccounts = require('./scopes/BusinessAccounts');

const ClubImpersonate = require('./actions/ClubImpersonate');
const ClubManualActivation = require('./actions/ClubManualActivation');
const ClubResendResetPassword = require('./actions/ClubResendResetPassword');
const ClubChangePassword = require('./actions/ClubChangePassword');

const ChangeBankNumber = require('./actions/ChangeBankNumber');
const GrantPermission = require('./actions/GrantPermission');
const RevisionActiveStates = require('./actions/RevisionActiveStates');
const RevisionBankNumbers = require('./actions/RevisionBankNumbers');
const RegisterOnLemon = require('./actions/RegisterOnLemon');
const FillClientsWithAire = require('./actions/FillClientsWithAire');
const WrongInactiveClients = require('./scopes/WrongInactiveClients');

module.exports = class GfClient extends Resource {
  /**
   * Prevent to configure swagger for `CRUD`.
   *
   * @type {Boolean}
   */
  preventSwagger = true;

  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [];

  /**
   * Eager loaded relation ships on index.
   *
   * @type {Array}
   */
  includeIndex = [
    {
      model: InvoiceClientsExtraField,
      as: 'extraFields',
      required: false,
    },
    {
      model: Country,
      attributes: ['id', 'name', 'isoCode'],
      as: 'nationality',
      required: false,
    },
    {
      model: GfContract,
      as: 'contracts',
      required: false,
      include: [
        {
          model: GfFeeGroup,
          as: 'fee_group',
          required: false,
          include: {
            model: GfSection,
            as: 'sections',
            required: false,
          },
        },
        {
          model: GfContractDataCell,
          as: 'dataCell',
          required: false,
        },
        {
          model: GfContractDataFix,
          as: 'dataFix',
          required: false,
        },
        {
          model: GfContractDataInternet,
          as: 'dataInternet',
          required: false,
        },
      ],
    },
  ];

  /**
   * Eager loaded relation ships on detail.
   *
   * @type {Array}
   */
  includeDetail = [{ all: true, required: false }];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return new GfClientFields().fields(request);
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
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [
      new ActivateClient(),
      new DeactivateClient().inline(),
      new ClubImpersonate().inline(),
      new ClubManualActivation().inline(),
      new ClubResendResetPassword().inline(),
      new ClubChangePassword().inline(),
      new ChangeBankNumber().inline(),
      new GrantPermission().inline(),
      new RevisionActiveStates().standalone(),
      new RevisionBankNumbers().standalone(),
      new RegisterOnLemon().inline(),
      new FillClientsWithAire().standalone(),
    ];
  }

  /**
   * Get the list of the resource scopes.
   *
   * @return {array}
   */
  scopes() {
    return [new BusinessAccounts(), new WrongInactiveClients()];
  }
};
