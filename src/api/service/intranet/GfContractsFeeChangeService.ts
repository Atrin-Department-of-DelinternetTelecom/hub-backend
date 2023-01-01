import { handle as ChangeFeeGroup } from './Actions/ChangeFeeGroup';
import { handle as ProcessChangeFeeGroupRequest } from './Actions/ProcessChangeFeeGroupRequest';
import { SERVICE } from '@api/constants/contracts';
import { getActualConditions } from './Fee/GfFeeService';
import { intranet } from '@api/models';
import moment from 'moment';
import { respondSuccess } from '@utils/response';

const { GfContractFeeChange, GfFeeGroup, GfSection, GfFee } = intranet;

export interface ChangeFeeParameters {
  contractId: number;
  feeGroupId: number;
  userId: number;
  previsionDate?: moment.Moment;
  executedDate?: moment.Moment;
  deletePending?: boolean;
}

export const change = async function ({
  contractId,
  feeGroupId,
  previsionDate,
  executedDate,
  deletePending = false,
  userId,
}: ChangeFeeParameters) {
  await ChangeFeeGroup({
    contractId,
    userId,
    feeGroupId,
    executedDate,
    previsionDate,
    force: deletePending,
  });
};

export const changeDone = async function ({
  contractFeeChangeId,
  userId,
  executedDate,
}: {
  contractFeeChangeId: number;
  executedDate?: moment.Moment;
  userId: number;
}) {
  const contractChange = await GfContractFeeChange.findByPk(
    contractFeeChangeId,
  );

  if (!contractChange) {
    throw new Error(`Cannot find the fee change id:${contractFeeChangeId}`);
  }

  await ProcessChangeFeeGroupRequest(contractChange, userId, executedDate);
  return { success: true };
};

export const clearChangeFeeHistory = async function ({
  contractId,
  fromFeeGroupId,
  toFeeGroupId,
}: {
  contractId: number;
  fromFeeGroupId: number;
  toFeeGroupId: number;
}) {
  const changeFeeA = await GfContractFeeChange.findOne({
    where: {
      contractId,
      fromFeeGroupId,
      toFeeGroupId,
    },
    order: [['id', 'DESC']],
  });

  const changeFeeB = await GfContractFeeChange.findOne({
    where: {
      contractId,
      fromFeeGroupId: toFeeGroupId,
      toFeeGroupId: fromFeeGroupId,
    },
    order: [['id', 'DESC']],
  });

  await changeFeeA?.update({ status: 0 });
  await changeFeeB?.update({ status: 0 });
};

export const getCompatibleFeeGroups = async function (feeGroupId: number) {
  const actualConditions = await getActualConditions(feeGroupId);
  const feeGroup = await GfFeeGroup.findOne({
    where: {
      id: feeGroupId,
    },
    include: {
      model: GfSection,
      as: 'sections',
      required: true,
    },
  });
  const code = feeGroup?.sections[0]?.code;

  if (!code) return respondSuccess([]);

  const codeAdditionalQuery =
    code === SERVICE.INTERNET
      ? { internetTechnology: actualConditions.internetTechnology }
      : {};

  const fees = await GfFee.findAll({
    order: [['fromDate', 'DESC']],
    where: codeAdditionalQuery,
    include: [
      {
        model: GfFeeGroup,
        as: 'feeGroup',
        required: true,
        where: {
          active: 1,
        },
        include: [
          {
            model: GfSection,
            as: 'sections',
            required: true,
            where: {
              code,
            },
          },
        ],
      },
    ],
  });

  const feeGroups: Array<{
    id: number;
    uid: number;
    name: string;
    internalName: string;
    creationDate: string;
    updateDate: string;
  }> = [];

  const hasFeeGroupId = (feeGroupId: number) => {
    return feeGroups.find((f) => f.id === feeGroupId);
  };

  for (const fee of fees) {
    if (fee.feeGroupId === feeGroupId) continue;
    if (!hasFeeGroupId(fee.feeGroupId)) {
      feeGroups.push({
        id: fee.feeGroup.id,
        uid: fee.feeGroup.uid,
        name: fee.feeGroup.name,
        internalName: fee.feeGroup.internalName,
        creationDate: fee.feeGroup.creationDate,
        updateDate: fee.feeGroup.updateDate,
      });
    }
  }

  return respondSuccess(feeGroups);
};
