import { ASSIGNABLE, ASSIGNABLE_HISTORY } from '@api/constants/statuses';
import { AnyModel, system } from '@api/models';
import {
  ServiceRecord,
  findForContract,
  forget,
  setupCache,
} from './Caches/GfContractSectionStatusCaches';
import { StatusEnum, statusMapping } from '../OperadorFixFacade';

import OperadorIvozService from '../OperadorIvozService';
import { OperadorLandline } from '@api/models/intranet/intranet_operador_landline';
import { OperadorLandlineHistory } from '@api/models/intranet/intranet_operador_landline_history';
import { SERVICE } from '@api/constants/contracts';
import { pluck } from '@api/utils/collections';

const { AssignableHistory, Assignable } = system;

/**
 * Release assignable values for given contracts.
 */
export const handle = async (
  contracts: AnyModel[],
  userId = 0,
): Promise<void> => {
  await setupCache(contracts.map((contract) => contract.id));

  await Promise.all(
    contracts.map(async (contract) => {
      return releaseAssignables((await findForContract(contract.id))!, userId);
    }),
  );

  await forget();
};

/**
 * Release assignable values for given service record.
 */
export const releaseAssignables = async (
  serviceRecord: ServiceRecord,
  userId = 0,
) => {
  if (serviceRecord.type === SERVICE.FIX) {
    await checkLandlineAssignments(serviceRecord, userId);
  }
  if (serviceRecord.type === SERVICE.INTERNET) {
    await checkIpAssignments(serviceRecord, userId);
  }
};

const checkIpAssignments = async ({ row }: ServiceRecord, userId = 0) => {
  const assignables = await Assignable.findAll({
    where: {
      value: [row!.staticIp, row!.IPv6_prefix],
      state: ASSIGNABLE.ASSIGNED,
    },
  });

  await Promise.all(
    assignables.map(async (assignable) => {
      await assignable.update({ state: ASSIGNABLE.ASSIGNABLE });
      await AssignableHistory.create({
        action_type: ASSIGNABLE_HISTORY.REALEASED,
        contract_id: row!.contractId,
        operator_id: userId,
        assignable_id: assignable.id,
      });
    }),
  );
};

const checkLandlineAssignments = async ({ row }: ServiceRecord, userId = 0) => {
  return (await isPortOut(row!.number))
    ? removeLandline(row!.number)
    : releaseLandline(row!.number, row!.contractId, userId);
};

const isPortOut = async (number: string | number) => {
  const { data } = await OperadorIvozService.getOutboundPortabilities({
    number,
    status: statusMapping[StatusEnum.CONSOLIDATED],
  });

  return data.length > 0;
};

const removeLandline = async (number: string | number) => {
  const landlines = await OperadorLandline.findAll({ where: { number } });
  // remove history
  OperadorLandlineHistory.destroy({
    where: { operador_landline_id: pluck(landlines, 'id') },
  });
  await OperadorLandline.destroy({ where: { number } });
};

const releaseLandline = async (
  number: string | number,
  contractId: number,
  userId: number,
) => {
  const landlines = await OperadorLandline.findAll({
    where: { number, state: ASSIGNABLE.ASSIGNED },
  });

  await Promise.all(
    landlines.map(async (landline) => {
      await landline.update({
        state: ASSIGNABLE.ASSIGNABLE,
        gf_contract_id: null,
      });
      await OperadorLandlineHistory.create({
        action_type: ASSIGNABLE_HISTORY.REALEASED,
        gf_contract_id: contractId,
        operador_landline_id: landline.id,
        operator_id: userId,
      });
    }),
  );
};
