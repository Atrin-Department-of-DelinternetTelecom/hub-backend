import { AnyModel, intranet } from '@models';
import {
  changeConditions,
  removeChangeConditionsEvent,
} from '../GfCrmContractService';
import {
  findForContract,
  forget,
  setupCache,
} from './Caches/GfContractSectionStatusCaches';
import { throwIf, throwUnless } from '@api/utils/helpers';

import { handle as ProcessChangeFeeGroupRequest } from './ProcessChangeFeeGroupRequest';
import { SERVICE } from '@api/constants/contracts';
import assert from 'assert';
import { getActualConditions } from '../Fee/GfFeeService';
import moment from 'moment';

const {
  GfContract,
  GfFeegroupsSectionsXref,
  GfContractFeeChange,
  transaction,
} = intranet;

export interface ChangeFeeGroupParams {
  contractId: number;
  feeGroupId: number;
  userId: number;
  previsionDate?: moment.Moment;
  executedDate?: moment.Moment;
  force?: boolean;
}

/**
 * Process a contract for changing the holder.
 */
export const handle = async ({
  contractId,
  feeGroupId,
  previsionDate = moment(),
  executedDate,
  force = false,
  userId,
}: ChangeFeeGroupParams) => {
  // start caches
  await setupCache([contractId]);
  // check service
  const { type } = (await findForContract(contractId)) ?? {};
  assert(type, 'Section not available or contract not found');
  throwIf(
    !Object.values(SERVICE).includes(type),
    'Section not available or contract not found',
  );
  // check contract existance
  const contract = await GfContract.findByPk(contractId);
  assert(contract, `Contract with id:${contractId} not found`);
  // check fee-group compability
  const actualConditions = await getActualConditions(contract.feeGroupId);
  const newConditions = await getActualConditions(feeGroupId);

  await checkCompatibility(
    actualConditions.feeGroupId,
    newConditions.feeGroupId,
  );

  await checkInProgressChangeFeeGroup(contractId, force);

  const requests = await makeChangeFeeGroupRequest(
    contract,
    actualConditions.feeGroupId,
    newConditions.feeGroupId,
    previsionDate,
    executedDate,
    checkNeedTechnicalAction(contract, actualConditions, newConditions, type),
    userId,
  );
  // forget caches
  await forget();

  return requests;
};

const makeChangeFeeGroupRequest = async (
  contract: AnyModel,
  fromFeeGroupId: number,
  toFeeGroupId: number,
  previsionDate = moment(),
  executedDate = moment(),
  needTechnicalAction = false,
  userId: number,
) => {
  await transaction(async () => {
    const contractChange = await GfContractFeeChange.create({
      fromFeeGroupId,
      toFeeGroupId,
      contractId: contract.id,
      previsionDate: previsionDate.format('YYYY-MM-DD HH:mm:ss'),
      done: !needTechnicalAction ? 1 : 0,
    });

    await changeConditions(
      contractChange.id,
      contract.isPendingSectionsReady(),
      userId,
    );

    if (!needTechnicalAction) {
      await ProcessChangeFeeGroupRequest(contractChange, userId, executedDate);
    }
  });
};

const checkCompatibility = async (oldFeeGroup: number, newFeeGroup: number) => {
  if (oldFeeGroup === newFeeGroup) {
    throw new Error('Same conditions, no change needed');
  }
  // verify fees are compatibles
  const oldXref = await GfFeegroupsSectionsXref.findOne({
    where: { feeGroupId: newFeeGroup },
  });
  const newXref = await GfFeegroupsSectionsXref.findOne({
    where: { feeGroupId: oldFeeGroup },
  });

  const newSection = newXref?.sectionId;
  const oldSection = oldXref?.sectionId;

  if (oldSection != newSection) {
    throw new Error(
      `Incompatible fees (different section type) ("${oldSection} - ${newSection}")`,
    );
  }
};

const checkInProgressChangeFeeGroup = async (
  contractId: number,
  force = false,
) => {
  const pendingChange = await GfContractFeeChange.findOne({
    where: {
      contractId,
      done: 0,
    },
  });

  if (pendingChange === null) {
    return;
  }

  throwUnless(force, 'An change fee-group request already in progress');

  await transaction(async () => {
    await pendingChange.update({ status: 0 });
    const result = await removeChangeConditionsEvent(pendingChange.id, false);

    throwUnless(
      result.success,
      `Error on removeChangeConditionsEvent: ${JSON.stringify(result)}`,
    );
  });
};

const checkNeedTechnicalAction = function (
  contract: AnyModel,
  actualConditions: Record<string, any>,
  newConditions: Record<string, any>,
  type: SERVICE,
) {
  if (
    contract.isPendingSectionsReady() ||
    ![SERVICE.INTERNET, SERVICE.FIX].includes(type)
  ) {
    return false;
  }

  return type === SERVICE.INTERNET
    ? actualConditions.internetTechnology !== newConditions.internetTechnology
    : actualConditions.fixConcurrentCalls !== newConditions.fixConcurrentCalls;
};
