'use strict';

const { GfBonus, GfBonusContractXref } = require('@models').intranet;

const CrmTaskHelperService = require('./CrmTaskHelperService');
const GfContractSectionStatusService = require('./GfContractSectionStatusService');

/*
 * installBono
 * No technical proces
 */
exports.installBono = async function (xrefId, userId) {
  const xref = await GfBonusContractXref.findByPk(xrefId);

  if (xref === null || xref.isDone()) return;

  const bonus = await GfBonus.findByPk(xref.bonoId);
  const { type } = await GfContractSectionStatusService.findForContract(
    xref.contractId,
  );

  return CrmTaskHelperService.createFullEvent(
    'installBono',
    xref.contractId,
    {
      subject: `Install ${type} bono`,
      metadata: {
        action: 'activateBono',
        contractId: xref.contractId,
        xrefId: xrefId,
      },
      aditionalInfo: {
        bono: bonus.name,
        description: bonus.description,
      },
      onetime: true,
    },
    type,
    `${xref.contractId}/${xrefId}`,
    userId,
  );
};

/**
 *
 * @param type $xrefId
 * @return type
 *
 * No technical process
 */
exports.uninstallBono = async function (xrefId, userId) {
  const xref = await GfBonusContractXref.findByPk(xrefId);

  if (xref === null) return { success: true };

  const { type } = await GfContractSectionStatusService.findForContract(
    xref.contractId,
  );

  if (xref.isPendingActivation()) {
    // bono has ddeactivated yet
    // do nothing except cancel possible activation event
    const installEventTrace = `installBono_${xref.contractId}/${xrefId}_${type}`;
    const installationEvent = await CrmTaskHelperService.eventExists(
      installEventTrace,
    );

    if (!installationEvent.executed)
      await CrmTaskHelperService.markAsCanceled(installEventTrace);

    return { success: true };
  }

  // Create uninstall event
  const bonus = await GfBonus.findByPk(xref.bonoId);

  return CrmTaskHelperService.createFullEvent(
    'uninstallBono',
    xref.contractId,
    {
      subject: `Uninstall ${type} bono`,
      metadata: {
        action: 'deactivateBono',
        contractId: xref.contractId,
        xrefId: xrefId,
      },
      aditionalInfo: {
        bono: bonus.name,
        description: bonus.description,
      },
      onetime: true,
    },
    type,
    `${xref.contractId}/${xrefId}`,
    userId,
  );
};

/**
 *
 * Error on no technicalSupport install bono
 *
 * @param type $xrefId
 * @return type
 */
exports.errorBono = async function (xrefId, userId) {
  const xref = await GfBonusContractXref.findByPk(xrefId);

  if (xref === null || xref.isDone()) return;

  const bonus = await GfBonus.findByPk(xref.bonoId);
  const { type } = await GfContractSectionStatusService.findForContract(
    xref.contractId,
  );

  return CrmTaskHelperService.createFullEvent(
    'errorBono',
    xref.contractId,
    {
      subject: `Error ${type} bono`,
      metadata: {
        action: 'errorBono',
        contractId: xref.contractId,
        xrefId: xrefId,
      },
      aditionalInfo: {
        bono: bonus.name,
        description: bonus.description,
      },
      onetime: true,
    },
    type,
    `${xref.contractId}/${xrefId}`,
    userId,
  );
};
