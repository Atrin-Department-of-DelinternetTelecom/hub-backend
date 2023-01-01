'use strict';

const { GfContractFeeChange } = require('@models').intranet;

const GfContractSectionStatusService = require('./GfContractSectionStatusService');
const CrmTaskHelperService = require('./CrmTaskHelperService');
const GfFeeService = require('./Fee/GfFeeService');

exports.changeConditions = async function (
  gfContractsFeeChangeId,
  onlyInfo = false,
  userId,
) {
  const changeFeeRow = await GfContractFeeChange.findByPk(
    gfContractsFeeChangeId,
  );
  const fromName = await GfFeeService.getNameFromFeeGroupId(
    changeFeeRow.fromFeeGroupId,
  );
  const toName = await GfFeeService.getNameFromFeeGroupId(
    changeFeeRow.toFeeGroupId,
  );
  const { section, type } =
    await GfContractSectionStatusService.findForContract(
      changeFeeRow.contractId,
    );

  const task = await CrmTaskHelperService.createFullEvent(
    'infoChangeConditions',
    changeFeeRow.contractId,
    {
      subject: `${type} change conditions`,
      onetime: true,
      aditionalInfo: {
        fromName: fromName,
        toName: toName,
      },
    },
    type,
    `${changeFeeRow.contractId}/${gfContractsFeeChangeId}`,
    userId,
  );

  if (onlyInfo) return task;

  return CrmTaskHelperService.createFullEvent(
    'changeConditions',
    changeFeeRow.contractId,
    {
      subject: `${type} change conditions`,
      onetime: true,
      aditionalInfo: {
        fromName: fromName,
        toName: toName,
      },
      metadata: {
        action: 'changeConditionsDone',
        contractId: changeFeeRow.contractId,
        changeId: gfContractsFeeChangeId,
      },
    },
    type,
    `${changeFeeRow.contractId}/${gfContractsFeeChangeId}`,
    userId,
  );
};

exports.removeChangeConditionsEvent = async function (
  gfContractsFeeChangeId,
  onlyExecutable = false,
) {
  const changeFeeRow = await GfContractFeeChange.findByPk(
    gfContractsFeeChangeId,
  );
  const { section, type } =
    await GfContractSectionStatusService.findForContract(
      changeFeeRow.contractId,
    );
  const refererTrace = `changeConditions_${changeFeeRow.contractId}/${gfContractsFeeChangeId}_${type}`;
  const event = await CrmTaskHelperService.eventExists(refererTrace);

  if (event && !event.executed) {
    await CrmTaskHelperService.markAsCanceled(refererTrace);
  }

  return {
    success: true,
  };
};
