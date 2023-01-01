// @ts-check
'use strict';

const GfContractService = require('../service/intranet/GfContractService');
const ChangeFeeNotificationService2 = require('../service/unpaid/ChangeFeeNotificationService2.js');
const { Action } = require('@models').system;
const { GfContract, UnpaidChangeFeeNotification } = require('@models').intranet;
const {
  clearChangeFeeHistory,
} = require('@service/intranet/GfContractsFeeChangeService');

/**
 *
 * @param {{
 *   id: number,
 *   feeGroupId: number,
 *   userId: number,
 *   systemUserId: number,
 *   previsionDate?: string,
 *   executedDate?: string,
 * }} params
 * @returns
 */
module.exports = async function changeFeeGroup(params, bulk, action) {
  const { id: contractId, feeGroupId, userId, systemUserId } = params;

  const {
    template,
    skipChangeFeeGroup,
    notificationType,
    isRevertBulk,
    previsionDate,
    executedDate,
  } = bulk.params ?? {};

  console.log('changeFeeGroup job started', params);

  // await snapshot.pre({ foo: "the pre value" });
  // await snapshot.pre(await MyModel.findByPk(id));
  const contract = await GfContract.findByPk(contractId);

  const oldFeeGroupId = contract.feeGroupId;
  const newFeeGroupId = params.feeGroupId;

  if (!skipChangeFeeGroup) {
    const result = await GfContractService.changeFeeGroup(
      contractId,
      {
        feeGroupId,
        previsionDate,
        executedDate,
      },
      userId,
    );

    if (result.code !== 200) {
      console.error('changeFeeGroup job failed', result);
      throw new Error(JSON.stringify(result));
    }

    if (isRevertBulk) {
      await clearChangeFeeHistory({
        contractId,
        fromFeeGroupId: oldFeeGroupId,
        toFeeGroupId: newFeeGroupId,
      });
    }
  }

  if (template) {
    try {
      if (notificationType === 'perClient') {
        const beenNotified = await UnpaidChangeFeeNotification.findOne({
          where: {
            client_id: contract.clientId,
            send_status: 'sent',
          },
          include: {
            model: Action,
            where: {
              bulk_id: bulk.id,
            },
          },
        });

        if (beenNotified) {
          console.log('changeFeeGroup job already notified');
          return { success: true, sms: 'skipped' };
        }
      }

      const result = await ChangeFeeNotificationService2.send({
        contractId,
        oldFeeGroupId,
        newFeeGroupId,
        clientId: contract.clientId,
        userId,
        systemUserId,
        template,
      });

      if (!result || !('changeFeedNotificationId' in result)) {
        throw new Error(JSON.stringify(result));
      }

      await action.update({
        model_name: 'unpaid_change_fee_notifications',
        model_id: result.changeFeedNotificationId,
      });

      return { success: true, sms: 'sent' };
    } catch (e) {
      return { success: true, sms: `Error: ${e.message}` };
    }
  }

  return { success: true, sms: 'skipped' };
};
