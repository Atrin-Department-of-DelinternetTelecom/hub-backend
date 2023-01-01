import { AnyModel, intranet } from '@models';
//@ts-ignore
import { get, groupBy, property } from 'lodash';
import { getFromClient, getSectionType } from './GfContractService';

import DiscountingPackageService from '../DiscountingPackageService';
import { GfBonoLabel } from '@api/models/intranet/intranet_gf_bono_label';
import { Op } from 'sequelize';
import { Static } from '@lib/cache';
import assert from 'assert';

import moment from 'moment';
import { throwIf } from '@utils/helpers';
import { prepareDiscountsForEvaluation } from './Discount/prepareDiscountsForEvaluation';
import { syncPendingDiscountsWithContracts } from './Discount/pendingDiscounts/syncPendingDiscountsWithContracts';

const {
  GfContract,
  GfDiscountsExecuted,
  GfDiscountsExecutedUsage,
  GfDiscountsMatrixExclusion,
  GfDiscountsMatrixRule,
  GfDiscountsPending,
  GfDiscountsMatrix,
  GfFeegroupsLabel,
  GfFeegroupsLabelsXref,
  GfFeeGroup,
  GfActiveFee,
  PackageStatus,
  GfUser,
  GfFeegroupsGroupLabel,
  PackageStatusContract,
  GfBonusContractXref,
  GfBonus,
} = intranet;

const CACHE_TIME = 1200;
export type Possbile = {
  type: string;
  matrixId: number;
  typeId: number;
};

export type PossbileCollection = Array<{
  pending: Array<Pending>;
  exclusionReasons: { [key: string]: Array<Reason> };
}>;

export type MatrixUsageRecord = Record<
  | `usedInMatrix_${number}`
  | `usedAsUsage_${number}`
  | `usedAsPendingPackage_${number}`
  | `usedAsUsageBonoUsage_${number}`,
  number
>;
export type ContractWithUsage = {
  id: number;
  state: string;
  feeGroup: {
    id: number;
    name: string;
    price: string;
    section: string;
    bonuses: { id: number; name: string; price: string; exist: boolean }[];
  };
  creator: {
    id: number;
    name: string;
  };
} & MatrixUsageRecord;

export type ShuffledPossbile = Possbile & {
  ruleId: number;
};

export type Reason = {
  name: string;
  reason: string;
};

export type Pending = {
  contractId: number;
  matrix: typeof AnyModel;
  rules: Array<{ [key: string]: any; possibles: Array<Possbile> }>;
};

export type BasePending = {
  contractId: number;
  matrixId: number;
  alias: string;
};

export type Discount = {
  base: BasePending;
  used: Array<ShuffledPossbile>;
  pendingId: number;
  key?: string;
  ambiguous?: boolean;
};

export const AllRulesException = class AllRulesException extends Error {
  constructor(public errors: Array<Reason>) {
    super('All rules not satisfied');
  }

  static withErrors(errors: Array<Reason>) {
    return new AllRulesException(errors);
  }
};

type matrixFailInfo = {
  id: string;
  matrixInfo: {
    name: string;
    id: number;
    discountAmount: string;
    discountType: string;
    actualPrice?: string;
    offerPrice?: string;
  };
  labelsInfo: {
    name: string;
    id: number;
    labelId: number;
    feeGroups: {
      id: number;
      name: string;
      price: string;
      section: string;
      bonuses: { id: number; name: string; price: string }[];
    }[];
    priceRange: { minPrice: string; maxPrice: string };
  }[];
  packageStatus?: { id: number; state: string };
  availableContracts?: {
    id: number;
    feeGroup: {
      id: number;
      name: string;
      price: string;
      section: string;
      bonuses: { id: number; name: string; price: string; exist: boolean }[];
    };
    state: string;
  }[];
  comeFromLable?: boolean;
};

export const suggestPossibleDiscount = async (clientId: number) => {
  const suggestedContractForDiscount: matrixFailInfo[] = [];

  const allPurchasedPackageStatus = await attachAllPurchasedPackageStatus(
    clientId,
  );

  const availableExecutedPacks = await suggestPackObjectFromExecutedPacks(
    clientId,
    allPurchasedPackageStatus,
  );

  const restOfActiveMatrices = await GfDiscountsMatrix.findAll({
    where: {
      active: true,
    },
  });

  for (const matrix of restOfActiveMatrices) {
    const matrixContract = await createMatrixObject(matrix.id);
    const clientContractObject = await createClientContractsObject(clientId);
    const result = generateSuggestContractObject(
      matrixContract,
      clientContractObject,
      matrix,
    );
    suggestedContractForDiscount.push(result);
  }

  return allPurchasedPackageStatus
    .concat(suggestedContractForDiscount)
    .concat(availableExecutedPacks);
};

const attachAllPurchasedPackageStatus = async (clientId: number) => {
  const suggestedContractForDiscount: matrixFailInfo[] = [];
  const purchasedPackages = await PackageStatus.findAll({
    where: {
      clientId,
    },
    include: [
      {
        model: GfContract,
        as: 'contracts',
        include: [
          {
            model: GfFeeGroup,
            as: 'fee_group',
            include: [{ model: GfActiveFee, as: 'gf_active_fee' }],
            required: false,
          },
          {
            model: GfBonus,
            as: 'bonuses',
            required: false,
          },
          {
            model: GfUser,
            as: 'seller',
            required: false,
          },
        ],
        required: false,
      },
      { model: GfDiscountsMatrix, as: 'matrix' },
    ],
    order: [['id', 'desc']],
  });

  for (const purchasedPackage of purchasedPackages) {
    const packageMatrixId = purchasedPackage.matrixId;
    const purchasedMatrixInfo = await getPackageAndAvailalbeContracts(
      {
        clientId,
        contracts: purchasedPackage.contracts,
        id: purchasedPackage.id,
        state: purchasedPackage.state,
      },
      true,
    );
    suggestedContractForDiscount.push({
      id: `${packageMatrixId}:${purchasedPackage.id}`,
      ...purchasedMatrixInfo,
      labelsInfo: [] as matrixFailInfo['labelsInfo'],
      matrixInfo: {
        id: purchasedPackage.matrix.id,
        name: purchasedPackage.matrix.alias,
        discountAmount: purchasedPackage.matrix.discount,
        discountType: purchasedPackage.matrix.discountType,
        ...calculateActualAndOfferPrice(
          purchasedMatrixInfo.availableContracts,
          [],
          purchasedPackage.matrix,
        ),
      },
    });
  }

  return suggestedContractForDiscount;
};

const suggestPackObjectFromExecutedPacks = async (
  clientId: number,
  alreadyActivePackages: matrixFailInfo[],
) => {
  const executedMatrixInfo: matrixFailInfo[] = [];

  const contractIds = (await GfContract.findAll({ where: { clientId } })).map(
    (contract) => contract.id,
  );

  const executedDiscounts = await GfDiscountsExecuted.findAll({
    where: { targetContractId: contractIds },
    include: [
      {
        model: GfDiscountsExecutedUsage,
        as: 'usages',
        include: [
          {
            model: GfContract,
            as: 'contract',
            required: false,
            include: [
              {
                model: GfFeeGroup,
                as: 'fee_group',
                include: [{ model: GfActiveFee, as: 'gf_active_fee' }],
              },
              {
                model: GfBonus,
                as: 'bonuses',
                required: false,
              },
              { model: GfUser, as: 'seller', required: false },
            ],
          },
        ],
      },
      { model: GfDiscountsMatrix, as: 'matrix' },
      {
        model: GfContract,
        as: 'contract',
        include: [
          {
            model: GfFeeGroup,
            as: 'fee_group',
            include: [{ model: GfActiveFee, as: 'gf_active_fee' }],
          },
          {
            model: GfBonus,
            as: 'bonuses',
            required: false,
          },
          { model: GfUser, as: 'seller', required: false },
        ],
      },
    ],
  });

  const alreadyActivePackagesMatrixKey = groupBy(
    alreadyActivePackages,
    property('matrixInfo.id'),
  );

  for (const executed of executedDiscounts) {
    if (
      executedHasPackage(
        executed,
        alreadyActivePackagesMatrixKey[executed.matrixId],
      )
    )
      continue;

    const contractsUsedInUsage: number[] = [];
    const contracts = (executed.usages ?? [])
      .filter((usage: AnyModel) => usage.type === 'contract')
      .map((usage: AnyModel) => {
        contractsUsedInUsage.push(usage.contract.id);
        return usage.contract;
      });
    if (!contractsUsedInUsage.includes(executed.contract.id))
      contracts.push(executed.contract);

    const availableContractsWithLable = await getPackageAndAvailalbeContracts(
      {
        id: executed.id,
        clientId,
        contracts,
        state: executed.active ? 'applied' : 'canceled',
      },
      true,
    );
    executedMatrixInfo.push({
      id: `${executed.matrixId}:${executed.id}`,
      labelsInfo: [],
      ...availableContractsWithLable,
      matrixInfo: {
        id: executed.matrix.id,
        name: executed.matrix.alias,
        discountAmount: executed.matrix.discount,
        discountType: executed.matrix.discountType,
        ...calculateActualAndOfferPrice(
          availableContractsWithLable.availableContracts,
          [],
          executed.matrix,
        ),
      },
    });
  }

  return executedMatrixInfo;
};

const executedHasPackage = (
  executed: AnyModel,
  packages: matrixFailInfo[] | undefined,
) => {
  if (!packages?.length) return false;

  for (const availablePackage of packages) {
    if (
      ((executed.active &&
        availablePackage.packageStatus?.state === 'applied') ||
        (!executed.active &&
          availablePackage.packageStatus?.state === 'canceled')) &&
      arraysEqual(
        (executed.usages ?? []).map((usage: AnyModel) => usage.typeId),
        (availablePackage.availableContracts ?? []).map(
          (availableContract) => availableContract.id,
        ),
      )
    )
      return true;
  }

  return false;
};

function arraysEqual(arr1: number[], arr2: number[]): boolean {
  if (arr1.length !== arr2.length) {
    return false;
  }

  arr1.sort((a, b) => a - b);
  arr2.sort((a, b) => a - b);

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
}

const generateSuggestContractObject = (
  matrixContractObject: Awaited<ReturnType<typeof createMatrixObject>>,
  clientContractObject: Awaited<ReturnType<typeof createClientContractsObject>>,
  matrix: AnyModel,
): matrixFailInfo => {
  const availableContracts: matrixFailInfo['availableContracts'] = [];
  const labelsInfo: matrixFailInfo['labelsInfo'] = [];
  for (const label of matrixContractObject) {
    let findedFeeGroup = false;
    for (const feeGroup of label.feeGroups) {
      //todo (ali): check accumolation and used contract here then pick valid contract object
      const selectedContract = findValidContract(
        matrix.id,
        clientContractObject,
        feeGroup,
      );
      if (selectedContract) {
        clientContractObject[feeGroup.id].pop();
        availableContracts.push(selectedContract);
        findedFeeGroup = true;
        break;
      }
    }
    if (!findedFeeGroup) labelsInfo.push(label);
  }

  return {
    id: `${matrix.id}`,
    matrixInfo: {
      id: matrix.id,
      name: matrix.alias,
      discountAmount: matrix.discount,
      discountType: matrix.discountType,
      ...calculateActualAndOfferPrice(availableContracts, labelsInfo, matrix),
    },
    availableContracts,
    labelsInfo,
  };
};

const findValidContract = (
  matrixId: number,
  clientContractObject: Awaited<ReturnType<typeof createClientContractsObject>>,
  feeGroup: matrixFailInfo['labelsInfo'][0]['feeGroups'][0],
) => {
  const contractWithSameFeeGroup = clientContractObject[feeGroup.id] ?? [];
  let selectedContract = null;
  for (const contract of contractWithSameFeeGroup) {
    const availableBonuses: Record<string, number> = {};
    contract.feeGroup.bonuses.forEach((bonus) => {
      if (!availableBonuses[bonus.id]) availableBonuses[bonus.id] = 1;
      else availableBonuses[bonus.id] += 1;
    });
    const keys = Object.keys(contract);
    if (
      keys.includes(`usedAsPendingPackage_${matrixId}`) ||
      keys.includes(`usedAsUsage_${matrixId}`) ||
      keys.includes(`usedInMatrix_${matrixId}`)
    )
      continue;

    const bonusesOfContract: (matrixFailInfo['labelsInfo'][0]['feeGroups'][0]['bonuses'][0] & {
      exist: boolean;
    })[] = [];
    if (feeGroup.bonuses?.length) {
      for (const bonus of feeGroup.bonuses) {
        if (!availableBonuses[bonus.id])
          bonusesOfContract.push({ ...bonus, exist: false });
        else {
          availableBonuses[bonus.id] -= 1;
          bonusesOfContract.push({ ...bonus, exist: true });
        }
      }
    }

    selectedContract = {
      ...contract,
      feeGroup: { ...contract.feeGroup, bonuses: bonusesOfContract },
    };
    break;
  }

  return selectedContract;
};

const calculateActualAndOfferPrice = (
  availableContracts: matrixFailInfo['availableContracts'],
  labelsInfo: matrixFailInfo['labelsInfo'],
  matrix: AnyModel,
) => {
  let total = 0;
  availableContracts?.forEach((contract) => {
    total += Number(contract.feeGroup.price);
  });

  labelsInfo?.forEach((label) => {
    total += Number(label.priceRange.maxPrice);
  });

  return {
    actualPrice: total.toFixed(2),
    offerPrice:
      matrix.discountType === 'fix'
        ? (total - Number(matrix.discount)).toFixed(2)
        : (total - (total * Number(matrix.discount)) / 100).toFixed(2),
  };
};

const createClientContractsObject = async (clientId: number) => {
  const contracts = await GfContract.findAll({
    where: { clientId, state: ['active', 'pendingSectionsReady'] },
    include: [
      {
        model: GfDiscountsExecuted,
        as: 'executed',
        where: { active: 1 },
        required: false,
        include: [{ model: GfDiscountsMatrix, as: 'matrix' }],
      },
      {
        model: GfFeeGroup,
        as: 'fee_group',
        include: [{ model: GfActiveFee, as: 'gf_active_fee' }],
      },
      {
        model: PackageStatusContract,
        as: 'package_statuses',
        required: false,
        include: [
          {
            model: PackageStatus,
            as: 'package',
            where: { state: ['pending'] },
            include: [
              {
                model: GfDiscountsMatrix,
                as: 'matrix',
              },
            ],
          },
        ],
      },
      { model: GfUser, as: 'seller', required: false },
      {
        model: GfBonus,
        as: 'bonuses',
        required: false,
      },
      {
        model: GfDiscountsExecutedUsage,
        as: 'as_usages',
        required: false,
        include: [
          {
            model: GfDiscountsExecuted.scope(['all']),
            as: 'executed',
            required: false,
            include: [{ model: GfDiscountsMatrix, as: 'matrix' }],
          },
        ],
      },
    ],
  });
  const clientContractsObject: Record<string, ContractWithUsage[]> = {};
  for (const contract of contracts) {
    const bonusXrefIds = contract.bonuses.map(
      (bonus: AnyModel) => bonus.GfBonusContractXref.id,
    );

    let bonusUsages: AnyModel[] = [];

    if (bonusXrefIds.length)
      bonusUsages = await GfDiscountsExecutedUsage.findAll({
        where: { id: bonusXrefIds, type: 'contract-bono' },
        include: [
          {
            model: GfDiscountsExecuted,
            as: 'executed',
            include: [{ model: GfDiscountsMatrix, as: 'matrix' }],
          },
        ],
      });

    if (!clientContractsObject[contract.feeGroupId])
      clientContractsObject[contract.feeGroupId] = [];
    clientContractsObject[contract.feeGroupId].push({
      id: contract.id,
      ...generateObjectByExecutedContract(
        contract.executed,
        contract.as_usages,
        contract.package_statuses,
        bonusUsages,
      ),
      state: contract.state,
      creator: {
        id: contract.seller?.id ?? 0,
        name: contract.seller?.name ?? '-',
      },
      feeGroup: {
        name: contract.fee_group.name,
        id: contract.fee_group.id,
        price: contract.fee_group?.gf_active_fee?.baseQuote ?? 0,
        section: await getSectionType(contract),
        bonuses:
          contract.bonuses?.map((bono: AnyModel) => ({
            id: bono.id,
            name: bono.name,
            price: bono.pvp,
          })) ?? [],
      },
    });
  }

  return clientContractsObject;
};

const generateObjectByExecutedContract = (
  executeds: AnyModel[],
  as_usages: AnyModel[],
  package_statuses_contract: AnyModel[],
  bonus_usages: AnyModel[],
) => {
  const executedObject: MatrixUsageRecord = {};
  for (const executed of executeds) {
    executedObject[`usedInMatrix_${executed.matrix.id}`] = executed.id;
  }

  for (const usage of as_usages) {
    executedObject[`usedAsUsage_${usage.executed.matrix.id}`] = usage.id;
  }

  for (const package_status_contract of package_statuses_contract) {
    executedObject[
      `usedAsPendingPackage_${package_status_contract.package.matrix.id}`
    ] = package_status_contract.id;
  }

  for (const bonus_usage of bonus_usages) {
    executedObject[`usedAsUsageBonoUsage_${bonus_usage.executed.matrix.id}`] =
      bonus_usage.id;
  }

  return executedObject;
};

const createMatrixObject = async (matrixId: number) => {
  const matrix = await GfDiscountsMatrix.findByPk(matrixId, {
    include: [
      {
        model: GfDiscountsMatrixRule,
        as: 'matrixRule',
        required: false,
        include: [
          {
            model: GfFeegroupsLabel,
            as: 'feegroupsLabel',
            required: false,
            include: [
              {
                model: GfFeegroupsLabelsXref,
                as: 'fee_groups',
                required: false,
                include: [
                  {
                    model: GfFeeGroup,
                    as: 'feeGroup',
                    required: false,
                    include: [
                      {
                        model: GfActiveFee,
                        as: 'gf_active_fee',
                        required: false,
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            model: GfBonoLabel,
            as: 'bonoLabel',
            required: false,
            include: [
              {
                model: GfBonus,
                as: 'bonuses',
                required: false,
                include: [
                  {
                    model: GfFeeGroup,
                    as: 'feeGroups',
                    required: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
  assert(matrix, 'matrix not found');
  const feeGroupsLables: matrixFailInfo['labelsInfo'] = [];

  const bonusRules: AnyModel[] = (matrix.matrixRule ?? []).filter(
    (rule: AnyModel) => rule.type === 'labeled_contract_bono_present',
  );

  const bonusObject: Record<
    string,
    matrixFailInfo['labelsInfo'][0]['feeGroups'][0]['bonuses']
  > = {};
  for (const matrixRule of bonusRules) {
    matrixRule.bonoLabel.bonuses.forEach((bonus: AnyModel) => {
      if (bonus.feeGroups[0]?.id && !bonusObject[bonus.feeGroups[0]?.id]) {
        bonusObject[bonus.feeGroups[0]?.id] = [
          {
            id: bonus.id as number,
            name: bonus.name as string,
            price: bonus.pvp as string,
          },
        ];
      } else if (bonusObject[bonus.feeGroups[0]?.id])
        bonusObject[bonus.feeGroups[0]?.id].push({
          id: bonus.id as number,
          name: bonus.name as string,
          price: bonus.pvp as string,
        });
    });
  }

  const feeGroupRules: AnyModel[] = (matrix.matrixRule ?? []).filter(
    (rule: AnyModel) => rule.type === 'labeled_contract_present',
  );

  const listOfIncludedFeeGroupsInLabels: number[] = [];

  for (const matrixRule of feeGroupRules) {
    const feeGroupXrefsOfEachLabel: AnyModel[] =
      matrixRule.feegroupsLabel.fee_groups;
    const feeGroupsIdOfEachLabel: matrixFailInfo['labelsInfo'][0]['feeGroups'] =
      [];
    let min = (
      Number(feeGroupXrefsOfEachLabel[0]?.feeGroup.gf_active_fee.baseQuote) +
      Number(
        bonusObject[feeGroupXrefsOfEachLabel[0]?.feeGroup.id]?.[0].price ?? 0,
      )
    ).toString();
    let max = min;
    for (const feeGroupXref of feeGroupXrefsOfEachLabel) {
      const price = (
        Number(feeGroupXref.feeGroup.gf_active_fee.baseQuote) +
        Number(bonusObject[feeGroupXref.feeGroup.id]?.[0].price ?? 0)
      ).toString();
      if (max < price) max = price;

      if (price < min) min = price;

      feeGroupsIdOfEachLabel.push({
        id: feeGroupXref.feeGroup.id,
        name: feeGroupXref.feeGroup.name,
        price,
        section: await getSectionType({
          feeGroupId: feeGroupXref.feeGroup.id,
        }),
        bonuses: bonusObject[feeGroupXref.feeGroup.id],
      });
      listOfIncludedFeeGroupsInLabels.push(feeGroupXref.feeGroup.id);
    }
    feeGroupsLables.push({
      labelId: matrixRule.id as number,
      id: matrixRule.feegroupsLabel.id as number,
      feeGroups: feeGroupsIdOfEachLabel,
      name: matrixRule.feegroupsLabel.name as string,
      priceRange: { maxPrice: max, minPrice: min },
    });
  }

  const targetFeeGroups: matrixFailInfo['labelsInfo'][0]['feeGroups'] = [];
  const feeGroups = await GfFeeGroup.findAll({
    where: { '$groupLabels.discountMatrix.id$': matrixId },
    include: [
      { model: GfActiveFee, as: 'gf_active_fee' },
      {
        model: GfFeegroupsGroupLabel,
        as: 'groupLabels',
        include: [
          {
            model: GfDiscountsMatrix,
            as: 'discountMatrix',
          },
        ],
      },
    ],
  });

  let min = feeGroups[0]?.gf_active_fee.baseQuote;
  let max = min;
  for (const feeGroup of feeGroups) {
    if (listOfIncludedFeeGroupsInLabels.includes(feeGroup.id)) continue;
    const price = feeGroup.gf_active_fee.baseQuote;
    if (price < min) min = price;
    if (max < price) max = price;
    const section = await getSectionType({ feeGroupId: feeGroup.id });
    targetFeeGroups.push({
      id: feeGroup.id,
      name: feeGroup.name,
      price,
      section: section,
      bonuses: bonusObject[feeGroup.id] ?? [],
    });
  }

  if (targetFeeGroups.length)
    feeGroupsLables.push({
      labelId: 0,
      id: 0,
      feeGroups: targetFeeGroups,
      name: 'target contract',
      priceRange: { maxPrice: max, minPrice: min },
    });

  return feeGroupsLables;
};

const getPackageAndAvailalbeContracts = async (
  packageStatus: {
    id?: number;
    clientId: number;
    contracts: AnyModel[];
    state: string;
  },
  attachExtraInfo: boolean | undefined,
) => {
  const getSectionRequests = [];
  for (const contract of packageStatus.contracts) {
    getSectionRequests.push(
      getSectionType({ feeGroupId: contract.fee_group.id }),
    );
  }
  const sectionResults = await Promise.all(getSectionRequests);

  return {
    comeFromLable: packageStatus.contracts.length ? true : false,
    ...(packageStatus.id
      ? { packageStatus: { id: packageStatus.id, state: packageStatus.state } }
      : {}),
    availableContracts: packageStatus.contracts.map(
      (contract: AnyModel, index: number) => {
        const creatorObject = attachExtraInfo
          ? {
              creator: {
                id: contract.seller?.id ?? 0,
                name: contract.seller?.name ?? '-',
              },
            }
          : {};
        return {
          id: contract.id,
          feeGroup: {
            name: contract.fee_group.name,
            id: contract.fee_group.id,
            price: contract.fee_group?.gf_active_fee?.baseQuote ?? 0,
            section: sectionResults[index],
            bonuses: contract.bonuses.map((bonus: AnyModel) => ({
              id: bonus.id as number,
              name: bonus.name as string,
              price: bonus.pvp as string,
              exist: true,
            })) as ContractWithUsage['feeGroup']['bonuses'],
          },
          state: contract.state,
          ...creatorObject,
        };
      },
    ),
  };
};

/*
 *
 * MATRIX DISCOUNTS RELATED
 *
 *
 * if discountMatrixId is provided, it's applied even if it is not active
 *
 * todayIs
 * if todayIs is informed, will discard all contracts with activationDate greater then todayIs
 * and all scheduled discounts with date < date("Y-m-d") are mark as applied
 *
 */
export const updateAllFromClient = async (
  clientId: number,
  discountMatrixId?: number,
  todayIs?: string,
  fullResult = false,
  userId?: number,
) => {
  const updateResult = await syncPendingDiscountsWithContracts(
    clientId,
    discountMatrixId,
    todayIs,
  );

  const executeResult = await prepareDiscountsForEvaluation(
    clientId,
    true,
    discountMatrixId,
    todayIs,
    userId,
  );

  return !fullResult
    ? executeResult
    : {
        success: true,
        pending: updateResult,
        executed: executeResult,
        exclusionReasons: updateResult.exclusionReasons,
      };
};

/**
 * Sync all pending discounts with current sitation of contracts
 * for example remove pending discounts that are not valid anymore
 * and create new pending discounts that are valid and not exist in database
 */
export const updateDiscountsPending = async (
  clientId: number,
  discountMatrixId?: number,
  todayIs?: string,
): Promise<{
  reasons: { [key: string]: Array<Reason> };
  exclusionReasons: { [key: string]: Array<Reason> };
  pending: Array<Discount>;
}> => {
  const {
    pendings,
    possibles,
    exclusionReasons,
  }: {
    possibles: PossbileCollection;
    exclusionReasons: { [key: string]: Array<Reason> };
    pendings: Array<Discount>;
  } = await getPossibleFromClient(
    clientId,
    todayIs ? moment(todayIs) : moment(),
    discountMatrixId,
  );

  // line 111 to line 137
  // sync pending discounts with current situation
  // of contracts
  // remove all saved to database pending discounts that are not
  // valid anymore will be removed and new pending discounts
  // that are valid and not exist in database will be created

  const recorded = await GfDiscountsPending.findAll({ where: { clientId } });
  const keysPending = pendings.map((item) => item.key);
  const keysRecorded = recorded.map((item) => item.key);

  // remove all recorded discounts that are not in pending
  await Promise.all(
    recorded
      .filter((item) => !keysPending.includes(item.key))
      .map((item) => item.update({ status: 0 })),
  );

  // create new pending discounts that are not in recorded
  await Promise.all(
    pendings
      .filter((item) => !keysRecorded.includes(item.key))
      .map((item) => {
        return GfDiscountsPending.create({
          key: item.key,
          clientId: clientId,
          contractId: item.base.contractId,
          matrixId: item.base.matrixId,
          used: JSON.stringify(item.used),
          ambiguos: item.ambiguous ? 1 : 0,
        });
      }),
  );

  return {
    pending: pendings,
    reasons: getTotalReasons(possibles),
    exclusionReasons,
  };
};

export const getTotalReasons = (
  possibles: PossbileCollection,
): { [key: string]: Array<Reason> } => {
  const totalReasons: { [key: string]: Array<Reason> } = {};

  possibles.forEach((possible) => {
    for (const contractId in possible.exclusionReasons) {
      totalReasons[contractId] = possible.exclusionReasons[contractId].concat(
        totalReasons[contractId] ?? [],
      );
    }
  });

  return totalReasons;
};

/**
 * Get executable discounts from client.
 */
export const getPossibleFromClient = async (
  clientId: number,
  targetDate: moment.Moment,
  discountMatrixId?: number,
  ignoreSpecificExecutedId?: number,
): Promise<{
  possibles: PossbileCollection;
  exclusionReasons: { [key: string]: Array<Reason> };
  pendings: Array<Discount>;
}> => {
  const { possibles, exclusionReasons, pendings } =
    await getPossiblePendingFromClient(
      clientId,
      targetDate,
      discountMatrixId,
      ignoreSpecificExecutedId,
    );
  const ambiguouses: Array<string> = getAmbiguouses(pendings);

  return {
    possibles,
    exclusionReasons,
    pendings: pendings.map((item: Discount): Discount => {
      // mark ambiguous
      const ambiguousKey = `${item.base.contractId}:${item.base.matrixId}`;
      const ambiguous = ambiguouses.includes(ambiguousKey);
      const usedKeys = item.used
        .map((item) => `${item.type}${item.typeId}`)
        .sort()
        .join(':');

      item.ambiguous = ambiguous;
      // generate unique key
      item.key = `${ambiguousKey}:${ambiguous ? 'true' : 'false'}`;

      if (usedKeys) item.key += `:${usedKeys}`;

      return item;
    }),
  };
};

export const getPossiblePendingFromClient = async (
  clientId: number,
  targetDate: moment.Moment,
  discountMatrixId?: number,
  ignoreSpecificExecutedId?: number,
): Promise<{
  possibles: PossbileCollection;
  exclusionReasons: { [key: string]: Array<Reason> };
  pendings: Array<Discount>;
}> => {
  // search for possible options
  const { possibles, exclusionReasons } = await getPossibleFromContracts(
    clientId,
    targetDate,
    discountMatrixId,
    ignoreSpecificExecutedId,
  );

  return {
    possibles,
    exclusionReasons,
    pendings: getPendingfromPossibles(possibles),
  };
};

export const getPossibleFromContracts = async (
  clientId: number,
  targetDate: moment.Moment,
  discountMatrixId?: number,
  ignoreSpecificExecutedId?: number,
): Promise<{
  possibles: PossbileCollection;
  exclusionReasons: { [key: string]: Array<Reason> };
}> => {
  const possibles: PossbileCollection = [];
  const reasons: { [key: string]: Array<Reason> } = {};

  // get all active client contracts at todayIs
  const contracts = await getClientActiveContracts(clientId, targetDate);

  for (const contract of contracts) {
    const { pending, exclusionReasons } = await hasDiscountsPending(
      contract,
      contracts,
      targetDate,
      discountMatrixId,
      ignoreSpecificExecutedId,
    );

    reasons[contract.id] = exclusionReasons.concat(reasons[contract.id] || []);

    if (pending.length > 0) {
      possibles.push({
        pending,
        exclusionReasons: { [contract.id]: exclusionReasons },
      });
    }
  }

  return { possibles, exclusionReasons: reasons };
};

export const getClientActiveContracts = async (
  clientId: number,
  targetDate: moment.Moment,
): Promise<Array<AnyModel>> => {
  const contracts: AnyModel[] = await getFromClient(
    clientId,
    true,
    false,
    true,
    false,
    false,
    true,
  );

  return contracts.filter((contract) => {
    // normal behavior
    // unset only if contract is not active
    if (!targetDate && !contract.isActive() && !contract.isBlocked()) {
      return false;
    }

    // is a fake date
    // only suspended, active and blocked
    if (
      !contract.isSuspended() &&
      !contract.isActive() &&
      !contract.isBlocked()
    ) {
      return false;
    }

    // remove contracts with dateActivation > todayIs
    // and dateDeactivation < todayIs
    // and is not null
    return (
      moment(contract.dateActivation).isSameOrBefore(targetDate) &&
      (!contract.dateDeactivation ||
        !moment(contract.dateDeactivation).isValid() ||
        moment(contract.dateDeactivation).isAfter(targetDate))
    );
  });
};

/**
 * Check if a contract has discounts in his discounts matrix not executed and possibles.
 */
export const hasDiscountsPending = async (
  contract: AnyModel,
  clientContracts: AnyModel[] = [],
  targetDate: moment.Moment,
  specificDiscountMatrixId?: number,
  ignoreExecutedId?: number,
): Promise<{ exclusionReasons: Array<Reason>; pending: Array<Pending> }> => {
  const pending: Array<Pending> = [];
  const exclusionReasons: Array<Reason> = [];
  const discountMatrices: AnyModel[] = (contract.discounts ?? []).filter(
    (matrix: AnyModel) => {
      return (
        !specificDiscountMatrixId ||
        Number(matrix.id) === Number(specificDiscountMatrixId)
      );
    },
  );

  const mapCallback = async (matrix: AnyModel) => {
    try {
      await checkExclusion(matrix, contract.id, specificDiscountMatrixId);
    } catch (error: any) {
      exclusionReasons.push({
        name: matrix.alias,
        reason: error.message,
      });
      return;
    }

    await exports
      .checkRules(
        matrix,
        clientContracts,
        contract,
        targetDate,
        ignoreExecutedId,
      )
      .then((rules: Array<{ possibles: Array<Possbile> }>) => {
        pending.push({
          contractId: contract.id,
          //@ts-ignore
          matrix,
          rules,
        });
      })
      .catch((exception: any) => {
        exception.errors.forEach((error: Reason) =>
          exclusionReasons.push(error),
        );
      });
  };

  for (let i = 0; i < discountMatrices.length; i++) {
    if (
      discountMatrices[i].dateActivation &&
      moment(contract.dateActivation).isBefore(
        moment(discountMatrices[i].dateActivation),
      )
    )
      continue;
    await mapCallback(discountMatrices[i]);
  }

  return { pending, exclusionReasons };
};

/**
 * Check if a contract has reason to exclude from discounting.
 */
export const checkExclusion = async (
  matrix: AnyModel,
  contractId: number,
  specificDiscountMatrixId?: number,
): Promise<void> => {
  throwIf(
    !matrix.isActive() && matrix.id !== specificDiscountMatrixId,
    'Matrix not active',
  );
  // check if we exced the maximum accumulation of this discount for this contract
  throwIf(
    await matrix.reachedAccumulation(contractId),
    `contractId:${contractId} matrixId:${matrix.id} Excluded for matrix accumulation limit`,
  );
  // check for incompatibility discounts
  // ignore it if executed discount for this contract by another discounts matrix
  throwIf(
    await hasIncompatibility(contractId, matrix.id),
    `contractId:${contractId} matrixId:${matrix.id} Excluded for incompatibility with other matrixIds`,
  );
  // check the discounting package exclusion
  await DiscountingPackageService.checkExclusion(matrix, contractId);
};

export const hasIncompatibility = async (
  contractId: number,
  matrixId: number,
): Promise<boolean> => {
  const exclusions = (await getExclusionRows())[matrixId] ?? [];
  const excludedMatrixIds = await getExcludedFromExecuteds(contractId);

  return !!exclusions.find((exclusion: AnyModel) => {
    return excludedMatrixIds.includes(exclusion.excludedMatrixId);
  });
};

/**
 * Group GfDiscountsMatrixExclusion by matrix id.
 *
 * @returns {Promise<Object<string, GfDiscountsMatrixExclusion[]>>}
 */
export const getExclusionRows = async (): Promise<
  Record<string, AnyModel[]>
> => {
  return Static.sear(
    'GfDiscountsPendingService.getExclusionRows',
    async () => GfDiscountsMatrixExclusion.prototype.groupByMatrixId(),
    CACHE_TIME,
  );
};

/**
 * @return {Promise<number[]>}
 */
export const getExcludedFromExecuteds = async (
  contractId: number,
): Promise<number[]> => {
  const executeds = await GfDiscountsExecuted.findAll({
    where: { targetContractId: contractId, active: 1 },
    attributes: ['matrixId'],
  });

  return executeds.map((executed: AnyModel) => executed.matrixId);
};

/**
 * Check all rules for given matrix.
 *
 * @throws AllRulesException
 */
export const checkRules = async (
  matrix: AnyModel,
  clientContracts: AnyModel[] = [],
  contract: AnyModel,
  targetDate: moment.Moment,
  ignoreExecutedId?: number,
): Promise<
  Array<
    AnyModel & {
      possibles: Array<Possbile>;
    }
  >
> => {
  const rules: AnyModel[] = (await getGroupedRules())[matrix.id] ?? [];
  const callbacks = rules.map(async (rule: AnyModel) => {
    return {
      ...rule.get({ plain: true }),
      possibles: await checkRule(
        rule,
        clientContracts,
        contract,
        ignoreExecutedId ? true : false,
        targetDate,
      ),
    };
  });

  const allSettled: Array<
    PromiseSettledResult<{
      status: string;
      value: AnyModel & {
        possibles: Array<Possbile>;
      };
    }>
  > = await Promise.allSettled(callbacks);
  //@ts-ignore
  const checkedRules = allSettled.map((item) => item.value);
  const errors = checkedRules.filter((rule) => rule.possibles.length === 0);
  checkedRules.reduce((acc, rule) => {
    let triggerPossible = false;
    rule.possibles.forEach((possible: Possbile) => {
      if (!acc[possible.typeId] && !triggerPossible) {
        triggerPossible = true;
        acc[possible.typeId] = true;
        return;
      }
    });
    if (!triggerPossible && ruleNotInError(errors, rule)) errors.push(rule);
    return acc;
  }, {});

  throwIf(
    errors.length > 0,
    AllRulesException,
    errors.map((rule) => {
      return {
        name: matrix.alias,
        reason: `ruleId:${rule.id} contractId:${contract.id} matrixId:${matrix.id} Rule fail, '${rule.type}'`,
      };
    }),
  );

  return checkedRules;
};

const ruleNotInError = (errors: AnyModel[], rule: AnyModel) => {
  return errors.find((error) => error.id === rule.id) ? false : true;
};

export const getGroupedRules = async (): Promise<{
  [key: string]: AnyModel[];
}> => {
  return Static.sear(
    'GfDiscountsPendingService.checkRules',
    async () => groupBy(await GfDiscountsMatrixRule.findAll(), 'matrixId'),
    CACHE_TIME,
  );
};

/**
 * Get all executed discounts for presented discount-matrix.
 */
export const checkDiscountPresentRule = async (
  rule: AnyModel,
  clientContracts: AnyModel[],
  evenExists = false,
  ignoreUsageAndTimeLimitFromUsages: AnyModel[] = [],
  targetDate?: moment.Moment,
): Promise<Array<Possbile>> => {
  const executeds = await GfDiscountsExecuted.findAll({
    where: {
      matrixId: rule.presentMatrixId,
      active: 1,
      targetContractId: clientContracts.map((contract) => contract.id),
    },
  });

  return executeds.map((executed: AnyModel) => {
    return {
      type: 'matrix',
      typeId: executed.id,
      //TODO: I added it to have the same format as the `checkLabeledContractPresentRule` result.
      //TODO: remove it if makes a problem
      matrixId: rule.matrixId,
    };
  });
};

/**
 * Get all executed discounts for presented contract by labels.
 */
export const checkLabeledContractPresentRule = async (
  rule: AnyModel,
  clientContracts: AnyModel[],
  evenExists = false,
  ignoreUsageAndTimeLimitFromUsages: AnyModel[] = [],
  targetDate?: moment.Moment,
): Promise<Array<Possbile>> => {
  const possibles: Array<Possbile> = [];
  const ignoredContracts = ignoreUsageAndTimeLimitFromUsages.map(
    (item) => item.typeId,
  );
  const ignoredIds = ignoreUsageAndTimeLimitFromUsages.map((item) => item.id);
  const usages = groupBy(
    await GfDiscountsExecutedUsage.findAll({
      where: {
        type: 'contract',
        typeId: clientContracts.map((contract) => contract.id),
      },
      include: [
        {
          model: GfDiscountsExecuted.scope(['all']),
          as: 'executed',
          required: true,
          where: {
            matrixId: rule.matrixId,
            [Op.or]: [{ status: 1 }, { status: 0, combinationExecutedTask: 1 }],
          },
        },
      ],
    }),
    'typeId',
  );

  const matrix = await GfDiscountsMatrix.findByPk(rule.matrixId);
  assert(matrix, 'matrix not found');
  for (const contract of clientContracts) {
    if (
      matrix.dateActivation &&
      moment(contract.dateActivation).isBefore(moment(matrix.dateActivation))
    )
      continue;

    if (Number(rule?.maxDaysExists) > 0) {
      const expire = moment(contract.dateActivation).isBefore(
        moment(targetDate).subtract(rule.maxDaysExists, 'days'),
      );
      // TODO: I think following condition is a logical bug
      // because will ignore some contracts without checking
      if (expire && !ignoredContracts.includes(contract.id)) return possibles;
    }

    const filter = {
      type: 'contract',
      typeId: contract.id,
      matrixId: rule.matrixId,
    };

    for (const label of contract.labels) {
      if (label.id !== rule.presentLabelId) continue;
      // found one contract with this label
      // now check if this contract is used yet
      // by the same feeGroupLabelId
      const contractUsages = usages[contract.id] ?? [];

      if (
        !!contractUsages.find((usage) => !ignoredIds.includes(usage.id)) &&
        !ignoredContracts.includes(contract.id) &&
        !evenExists
      ) {
        continue;
      }

      possibles.push(filter);
    }
  }

  return possibles;
};

export const checkLabeledContractBonoPresentRule = async (
  rule: AnyModel,
  clientContracts: AnyModel[],
  evenExists = false,
  ignoreUsageAndTimeLimitFromUsages: AnyModel[] = [],
  targetDate?: moment.Moment,
): Promise<Array<Possbile>> => {
  const possibles: Array<Possbile> = [];
  const ignoredContracts = ignoreUsageAndTimeLimitFromUsages.map(
    (item) => item.typeId,
  );

  const bonoXrefs = await GfBonusContractXref.findAll({
    where: {
      contractId: clientContracts.map((contract) => contract.id),
    },
  });

  const ignoredIds = ignoreUsageAndTimeLimitFromUsages.map((item) => item.id);
  const usages = groupBy(
    await GfDiscountsExecutedUsage.findAll({
      where: {
        type: 'contract-bono',
        typeId: bonoXrefs.map((bonoXref) => bonoXref.id),
      },
      include: [
        {
          model: GfDiscountsExecuted.scope(['all']),
          as: 'executed',
          required: true,
          where: {
            matrixId: rule.matrixId,
            [Op.or]: [{ status: 1 }, { status: 0, combinationExecutedTask: 1 }],
          },
        },
      ],
    }),
    'typeId',
  );

  const matrix = await GfDiscountsMatrix.findByPk(rule.matrixId);
  assert(matrix, 'matrix not found');
  for (const contract of clientContracts) {
    if (
      matrix.dateActivation &&
      moment(contract.dateActivation).isBefore(moment(matrix.dateActivation))
    )
      continue;

    if (Number(rule?.maxDaysExists) > 0) {
      const expire = moment(contract.dateActivation).isBefore(
        moment(targetDate).subtract(rule.maxDaysExists, 'days'),
      );
      if (expire && !ignoredContracts.includes(contract.id)) return possibles;
    }

    for (const bono of contract.bonus) {
      if (
        !bono.labels
          .map((label: GfBonoLabel) => label.id)
          .includes(rule.presentLabelId)
      )
        continue;

      const filter = {
        type: 'contract-bono',
        typeId: bono.xrefId,
        matrixId: rule.matrixId,
      };

      const bonusUsages = usages[bono.xrefId] ?? [];

      if (
        !!bonusUsages.find((usage) => !ignoredIds.includes(usage.id)) &&
        !ignoredContracts.includes(contract.id) &&
        !evenExists
      )
        continue;

      possibles.push(filter);
    }
  }

  return possibles;
};

const ruleTypeHandler = {
  labeled_contract_present: checkLabeledContractPresentRule,
  discount_present: checkDiscountPresentRule,
  labeled_contract_bono_present: checkLabeledContractBonoPresentRule,
};

export const checkRule = async (
  rule: AnyModel,
  clientContracts: AnyModel[] = [],
  targetContract?: AnyModel,
  evenExists = false,
  targetDate?: moment.Moment,
  ignoreUsageAndTimeLimitFromUsages: Array<AnyModel & { typeId: any }> = [],
): Promise<Array<Possbile>> => {
  if (!Object.keys(ruleTypeHandler).includes(rule?.type)) {
    return [];
  }
  const isExpired = moment(targetContract?.dateActivation).isBefore(
    moment(targetDate).subtract(rule.maxDaysTargetExists, 'days'),
  );
  const ignored = ignoreUsageAndTimeLimitFromUsages.find(
    (item) => Number(item.typeId) === Number(targetContract?.id),
  );
  if (
    Number(rule?.maxDaysTargetExists) > 0 &&
    ignored === undefined &&
    isExpired
  ) {
    return [];
  }

  return ruleTypeHandler[rule.type as keyof typeof ruleTypeHandler](
    rule,
    clientContracts,
    evenExists,
    ignoreUsageAndTimeLimitFromUsages,
    targetDate,
  );
};

export const getPendingfromPossibles = (
  possibles: PossbileCollection,
): Array<Discount> => {
  return possibles.flatMap((possible) => {
    return possible.pending.flatMap((pending) => {
      const base: BasePending = {
        contractId: pending.contractId,
        //@ts-ignore
        matrixId: pending.matrix.id,
        //@ts-ignore
        alias: pending.matrix.alias,
      };

      return exports
        .getShuffledPossibilities(pending)
        .map((shuffle: Array<ShuffledPossbile>): Discount => {
          return {
            base: base,
            used: shuffle,
            // TODO: this is a bug exists in PHP code
            //@ts-ignore
            pendingId: pending.id,
          };
        });
    });
  });
};

export const getShuffledPossibilities = (
  pending: Pending,
): Array<Array<ShuffledPossbile>> => {
  const possibilities: Array<Array<ShuffledPossbile>> = pending.rules.map(
    (rule): Array<ShuffledPossbile> => {
      return rule.possibles.map((possbile: Possbile): ShuffledPossbile => {
        return {
          ...possbile,
          ruleId: rule.id,
        };
      });
    },
  );

  return shuflePossibilities(possibilities);
};

function shuflePossibilities(
  possibilities: Array<Array<ShuffledPossbile>>,
  node = 0,
): Array<Array<ShuffledPossbile>> {
  const histroy: Array<string> = [];
  const combinations = _shuflePossibilities(possibilities, node).filter(
    (combination: Array<ShuffledPossbile>): boolean => {
      const keys = [
        ...new Set(
          combination.map((shuffledPossbile) => {
            return `${shuffledPossbile.type}:${shuffledPossbile.typeId}`;
          }),
        ),
      ];

      if (
        keys.filter((key, index) => keys.indexOf(key) === index).length !==
        combination.length
      ) {
        // remove duplicated
        return false;
      }

      const bKey = keys.sort().join(':');

      return histroy.includes(bKey)
        ? false // remove redundant
        : Boolean(histroy.push(bKey)); // save histroy
    },
  );

  return combinations;
}

function _shuflePossibilities(
  possibilities: Array<Array<ShuffledPossbile>>,
  node = 0,
): Array<Array<ShuffledPossbile>> {
  const ret = [];
  for (const i in possibilities[node]) {
    const o = possibilities[node][i];
    if (!possibilities[node + 1]) {
      // end of chain
      ret.push([o]);
    } else {
      // to combine
      const toCombine = _shuflePossibilities(possibilities, node + 1);
      for (const j in toCombine) {
        const tc = toCombine[j];
        ret.push(tc.concat([o]));
      }
    }
  }
  return ret;
}

export const getAmbiguouses = (pendings: Array<Discount>): Array<string> => {
  // check ambiguous
  const useds: { [key: string]: string[] } = {};
  pendings.forEach((pending) => {
    pending.used.forEach((item) => {
      const key = `${item.type}_${item.typeId}`;
      if (!useds[key]) useds[key] = [];
      useds[key].push(`${pending.base.contractId}:${pending.base.matrixId}`);
    });
  });

  return Object.values(useds)
    .filter((used) => used.length !== 1)
    .flatMap((used) => used);
};

export const searchSubstitutiveActor = async (
  executedRow: AnyModel,
  actorId: number,
  futureUsagesReleased: AnyModel[],
): Promise<
  | {
      success: true;
      replacements: { fromTypeId: number; toTypeId: number; type: string }[];
    }
  | { success: false }
> => {
  const replacements: { fromTypeId: number; toTypeId: number; type: string }[] =
    [];

  //@ts-ignore
  const contract: AnyModel = await GfContract.findByPk(
    executedRow.targetContractId,
  );
  const clientContracts: AnyModel[] = await getFromClient(
    contract?.clientId,
    false,
    false,
    true,
  ).then((contracts: AnyModel[]) => {
    // only active contracts
    return contracts.filter((contract) => contract.isActive());
  });

  //find last usage of actor
  const contractUsage = await GfDiscountsExecutedUsage.findOne({
    where: {
      executedId: executedRow.id,
      type: 'contract',
      typeId: actorId,
    },
    order: [['id', 'DESC']],
  });

  const rule: AnyModel | null = await GfDiscountsMatrixRule.findByPk(
    contractUsage?.ruleId ?? 0,
  );

  if (!rule) return { success: false };

  const checkRuleRes = await checkRule(
    rule,
    clientContracts,
    contract,
    false,
    moment(),
    //@ts-ignore
    futureUsagesReleased.filter((usage) => usage.type === 'contract'),
  );
  const contractTypeId = get(checkRuleRes, '0.typeId') as number | undefined;

  if (!contractTypeId) {
    return { success: false };
  }

  replacements.push({
    fromTypeId: actorId,
    toTypeId: contractTypeId,
    type: 'contract',
  });

  //we have contract replacement now we should check on bonus replacement
  const bonusXrefs = await GfBonusContractXref.findAll({
    where: { contractId: actorId },
  });
  if (!bonusXrefs.length) return { success: true, replacements };

  const bonusUsages = await GfDiscountsExecutedUsage.findAll({
    where: {
      executedId: executedRow.id,
      type: 'contract-bono',
      typeId: bonusXrefs.map((bonoXref) => bonoXref.id),
    },
    order: [['id', 'DESC']],
  });

  const bonoFutureUsage = futureUsagesReleased.filter(
    (usage) => usage.type === 'contract-bono',
  );
  for (const bonusUsage of bonusUsages) {
    const bonoRule: AnyModel | null = await GfDiscountsMatrixRule.findByPk(
      bonusUsage.ruleId,
    );

    assert(bonoRule, 'rule not found');

    const checkRuleRes = await checkRule(
      bonoRule,
      clientContracts,
      contract,
      false,
      moment(),
      //@ts-ignore
      bonoFutureUsage,
    );
    const bonoXrefTypeId = get(checkRuleRes, '0.typeId') as number | undefined;
    if (!bonoXrefTypeId) return { success: false };
    replacements.push({
      fromTypeId: bonusUsage.typeId,
      type: 'contract-bono',
      toTypeId: bonoXrefTypeId,
    });
  }

  return {
    success: true,
    replacements,
  };
};
