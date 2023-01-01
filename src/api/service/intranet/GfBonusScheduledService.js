// @ts-check
'use strict';

const { GfBonusScheduled } = require('@models').intranet;
const GfBonusService = require('./Fee/GfBonusService');

exports.addScheduledBono = async function (
  bonoId,
  contractId,
  initDate,
  endDate,
  executedId,
  keyGroup,
  userId,
) {
  const bonusScheduled = await GfBonusScheduled.create({
    bonoId: bonoId,
    contractId: contractId,
    executedId: executedId,
    initDate: initDate ?? null,
    endDate: endDate ?? null,
    keyGroup: keyGroup,
  });

  await exports.searchAndApplyIndate(contractId, userId);
  await exports.searchAndApplyOutdate(contractId, userId);

  return bonusScheduled;
};

/**
 * Search promitional bonos that must be activated and create his bono.
 *
 * @param {number} contractId
 * @returns
 */
exports.searchAndApplyIndate = async function (contractId, userId) {
  const bonuses = await GfBonusScheduled.inDates(contractId);

  await Promise.all(bonuses.map((bonus) => exports.createBono(bonus, userId)));

  return { success: true };
};

/**
 * Search promitional bonos that must be deactivated and remove the bono
 * @param {number} contractId
 * @param {number} userId
 * @returns
 */
exports.searchAndApplyOutdate = async function (contractId, userId) {
  const bonuses = await GfBonusScheduled.outDates(contractId);

  await Promise.all(
    bonuses.map((bonus) => {
      return GfBonusService.removeBonus(bonus, false, true, userId);
    }),
  );

  return { success: true };
};

exports.createBono = async (bonusScheduled, userId) => {
  const bonusContractXrefId = await GfBonusService.addBonus(
    bonusScheduled.contractId,
    bonusScheduled.bonoId,
    false,
    true,
    null,
    userId,
  );

  if (bonusContractXrefId) await bonusScheduled.update({ bonusContractXrefId });

  return bonusContractXrefId;
};
