'use strict';

const { GfContractHolderChange } = require('@models').intranet;

const GfContractSectionStatusService = require('./GfContractSectionStatusService');
const CrmTaskHelperService = require('./CrmTaskHelperService');

exports.infoChangeHolder = async function (changeId, userId) {
  const holderChange = await GfContractHolderChange.findByPk(changeId);
  const { type } = await GfContractSectionStatusService.findForContract(
    holderChange.contractId,
  );

  await exports.infoChangeHolderFrom(holderChange, type, userId);
  await exports.infoChangeHolderTo(holderChange, type, userId);
};

exports.infoChangeHolderFrom = async function (holderChange, type, userId) {
  return CrmTaskHelperService.createFullEvent(
    'infoChangeHolderFrom',
    holderChange.contractId,
    {
      subject: 'Change holder',
      clientId: holderChange.fromClientId,
      //"onetime"   => true
    },
    type,
    null,
    userId,
  );
};

exports.infoChangeHolderTo = async function (holderChange, type, userId) {
  return CrmTaskHelperService.createFullEvent(
    'infoChangeHolderTo',
    holderChange.contractId,
    {
      subject: 'Change holder',
      clientId: holderChange.toClientId,
      //"onetime"   => true
    },
    type,
    null,
    userId,
  );
};
