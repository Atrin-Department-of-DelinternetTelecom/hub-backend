import { AnyModel, intranet, system } from '@api/models';

import { Op } from 'sequelize';
import { SUSPENSION_ACTION_TYPE } from '@api/constants/contracts';
import { handle as SuspendContracts } from './SuspendContracts';
import { SuspendingAction } from '@api/models/global/global_suspending_action';
import moment from 'moment';

const { User } = system;
const { GfContract } = intranet;

/**
 * Ran the given suspending actions.
 */
export const handle = async (
  suspensions: SuspendingAction[] = [],
): Promise<{ suspended: AnyModel[]; errors: any[] }> => {
  if (suspensions.length === 0) {
    suspensions = await scheduledSuspensions();
  }

  const contracts = suspensions.map(({ gf_contract_id }) => gf_contract_id);
  // update frozen contracts
  await applyFrozenSuspensions(suspensions);
  // do suspend contracts
  const results = await SuspendContracts(
    await GfContract.findAll({
      where: { id: contracts, state: { [Op.not]: 'suspended' } },
    }),
    suspensions[0]?.operator_id,
  );
  // modify deactivation dates
  await modifyOldDeactivationDates(suspensions);

  const suspended = await GfContract.findAll({
    where: { id: contracts, state: 'suspended' },
  });

  await SuspendingAction.update(
    { suspended_at: moment().toDate() },
    {
      where: {
        gf_contract_id: suspended.map((suspended) => suspended.id),
        suspended_at: null,
      },
    },
  );

  return {
    suspended,
    errors: results
      .filter((result) => result.status === 'rejected')
      .map((result) => (result as PromiseRejectedResult).reason),
  };
};

const scheduledSuspensions = async () => {
  return SuspendingAction.findAll({
    where: {
      suspend_at: { [Op.gte]: moment().toDate() },
      suspended_at: null,
    },
    include: [{ model: User }],
  });
};

const applyFrozenSuspensions = async (suspensions: SuspendingAction[]) => {
  const frozen = suspensions
    .filter(({ action_type }) => action_type === SUSPENSION_ACTION_TYPE.FROZEN)
    .map(({ gf_contract_id }) => gf_contract_id);

  return GfContract.update({ frozen: true }, { where: { id: frozen } });
};

const modifyOldDeactivationDates = async (suspensions: SuspendingAction[]) => {
  return Promise.all(
    suspensions
      .filter((suspension) => suspension.isSuspendedInPast())
      .map((suspension) => {
        return GfContract.update(
          {
            dateDeactivation: moment(suspension.suspend_at).format(
              'YYYY-MM-DD HH:mm:ss',
            ),
          },
          {
            where: { id: suspension.gf_contract_id, dateDeactivation: null },
          },
        );
      }),
  );
};
