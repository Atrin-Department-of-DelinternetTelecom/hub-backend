import { AnyModel, intranet } from '@api/models';
import {
  Tags,
  _validator,
  getSectionType,
  onAfterInsert,
} from './GfContractService';

import ValidationException from '@lib/crud/Exceptions/ValidationException';
import assert from 'assert';
import { errors } from '@api/http/http_errors';
import { getAllEntities } from '@api/utils/request-handler';
import { hasRole } from './AclService';
import { pluck } from '@api/utils/collections';
import { suggestPossibleDiscount } from './GfDiscountsPendingService';
import to from 'await-to-js';

type INTERNET = {
  addressProvinceCodeName: string;
  addressProvinceCode: string;
  addressProvince: string;
  addressCityCodeName: string;
  addressCityCode: string;
  addressCity: string;
  addressPostalCodeCodeName: string;
  addressPostalCodeCode: string;
  addressPostalCode: string;
  addressStreetTypeCodeName: string;
  addressStreetTypeCode: string;
  addressStreetCodeName: string;
  addressStreetCode: string;
  addressStreet: string;
  addressNumberCodeName: string;
  addressNumberCode: string;
  addressNumber: string;
};
type CELL = { number: string; iccPlusControlDigit: string };
type FIX = { internetSectionId: number; type: string };
type TV = { internetContractId: number };
type SUBSCRIPTION = { internetContractId: number };

type CONTRACT_TYPES = INTERNET | FIX | CELL | TV | SUBSCRIPTION;

type CreationBody = {
  matrixId: number;
  clientId: number;
  contracts: {
    feeGroupId: number;
    data: INTERNET | CELL | FIX | TV | SUBSCRIPTION;
    tags: Tags;
    comments: string;
  }[];
};

const {
  PackageStatus,
  GfDiscountsMatrix,
  GfClient,
  GfContract,
  transaction,
  PackageStatusContract,
  GfContractDataInternet,
  GfContractDataFix,
  GfContractDataCell,
  GfContractDataTv,
  GfContractDataSubscription,
  ContractTagMapping,
} = intranet;

export const postPackageStatus = async function (
  body: CreationBody,
  userId: number,
) {
  const { matrixId, clientId, contracts } = body;

  const matrix = await GfDiscountsMatrix.findByPk(body.matrixId);
  if (!matrix)
    throw new errors.NotFound(`matrix with id ${body.matrixId} not found.`);

  const client = await GfClient.findByPk(body.clientId);
  if (!client)
    throw new errors.NotFound(`client with id ${body.clientId} not found.`);

  const newPackageStatus = await PackageStatus.create({ ...body, userId });
  for (const contract of contracts) {
    await createContractWithSection(
      {
        contractSectionData: contract.data,
        feeGroupId: contract.feeGroupId,
        tags: contract.tags,
        comments: contract.comments,
      },
      { clientId, creatorId: userId, packageStatusId: newPackageStatus.id },
    );
  }

  await attachAvailableContractsToPackage(
    clientId,
    matrixId,
    newPackageStatus.id,
  );

  return newPackageStatus;
};

const attachAvailableContractsToPackage = async (
  clientId: number,
  matrixId: number,
  packageId: number,
) => {
  const selectedPackage = await getPackageDiscountInfoById(
    clientId,
    matrixId,
    0,
  );

  await Promise.all(
    (selectedPackage.availableContracts ?? []).map((availableContract) =>
      attachToPackageStatus(packageId, availableContract.id),
    ),
  );
};

export const getPackageDiscountInfoById = async function (
  clientId: number,
  matrixId: number,
  packageId?: number,
) {
  const suggests = await suggestPossibleDiscount(clientId);
  let selected = null;

  for (const matrixSuggest of suggests) {
    if (
      matrixSuggest.matrixInfo.id === matrixId &&
      (matrixSuggest.packageStatus?.id ?? 0) === packageId
    ) {
      selected = matrixSuggest;
    }
  }

  if (!selected) throw new errors.NotFound(`${matrixId} not available`);

  return selected;
};

export const suggestDiscount = async function (clientId: number) {
  const client = await GfClient.findByPk(clientId);
  if (!client)
    throw new errors.NotFound(`${GfClient.name} with id:${clientId} not found`);
  return suggestPossibleDiscount(clientId);
};

export const suggestDiscounts = async function (query) {
  return getAllEntities(query, PackageStatus, {}, [
    {
      model: GfDiscountsMatrix,
      as: 'matrix',
      required: false,
      attributes: ['id', 'alias'],
    },
    {
      model: GfClient,
      as: 'client',
      required: false,
      attributes: ['id', 'name', 'fiscalId'],
    },
  ]);
};

const createInternetContractWithSectionData = async function (
  contractInfo: {
    contractSectionData: INTERNET;
    feeGroupId: number;
    clientId: number;
    tags: Tags;
    comments: string;
  },
  creatorId: number,
) {
  const newContract = await createContract(
    {
      clientId: contractInfo.clientId,
      feeGroupId: contractInfo.feeGroupId,
      contractSectionData: contractInfo.contractSectionData,
      tags: contractInfo.tags,
      comments: contractInfo.comments,
    },
    creatorId,
  );

  const contractDataInternet = await GfContractDataInternet.findOne({
    where: { contractId: newContract.id },
  });

  if (contractDataInternet) {
    await contractDataInternet.update(contractInfo.contractSectionData);
    return newContract;
  }

  await GfContractDataInternet.create({
    contractId: newContract.id,
    ...contractInfo.contractSectionData,
  });
  return newContract;
};

const createFixContractWithSectionData = async function (
  contractInfo: {
    contractSectionData: FIX;
    feeGroupId: number;
    clientId: number;
    tags: Tags;
    comments: string;
  },
  creatorId: number,
) {
  const newContract = await createContract(
    {
      clientId: contractInfo.clientId,
      feeGroupId: contractInfo.feeGroupId,
      contractSectionData: contractInfo.contractSectionData,
      tags: contractInfo.tags,
      comments: contractInfo.comments,
    },
    creatorId,
  );

  const contractDataFix = await GfContractDataFix.findOne({
    where: { contractId: newContract.id },
  });

  if (contractDataFix) {
    await contractDataFix.update(contractInfo.contractSectionData);
    return newContract;
  }

  await GfContractDataFix.create({
    contractId: newContract.id,
    ...contractInfo.contractSectionData,
  });
  newContract;
};

const createCellContractWithSectionData = async function (
  contractInfo: {
    contractSectionData: CELL;
    feeGroupId: number;
    clientId: number;
    tags: Tags;
    comments: string;
  },
  creatorId: number,
) {
  const newContract = await createContract(
    {
      clientId: contractInfo.clientId,
      feeGroupId: contractInfo.feeGroupId,
      contractSectionData: contractInfo.contractSectionData,
      tags: contractInfo.tags,
      comments: contractInfo.comments,
    },
    creatorId,
  );

  const contractDataCell = await GfContractDataCell.findOne({
    where: { contractId: newContract.id },
  });

  if (contractDataCell) {
    await contractDataCell.update(contractInfo.contractSectionData);
    return newContract;
  }

  await GfContractDataCell.create({
    contractId: newContract.id,
    ...contractInfo.contractSectionData,
  });

  return newContract;
};

const createTvContractWithSectionData = async function (
  contractInfo: {
    contractSectionData: TV;
    feeGroupId: number;
    clientId: number;
    tags: Tags;
    comments: string;
  },
  creatorId: number,
) {
  const newContract = await createContract(
    {
      clientId: contractInfo.clientId,
      feeGroupId: contractInfo.feeGroupId,
      contractSectionData: contractInfo.contractSectionData,
      tags: contractInfo.tags,
      comments: contractInfo.comments,
    },
    creatorId,
  );

  const contractDataTv = await GfContractDataTv.findOne({
    where: { contractId: newContract.id },
  });

  if (contractDataTv) {
    await contractDataTv.update(contractInfo.contractSectionData);
    return newContract;
  }

  await GfContractDataTv.create({
    contractId: newContract.id,
    ...contractInfo.contractSectionData,
  });

  return newContract;
};

const createSubscriptionContractWithSectionData = async function (
  contractInfo: {
    contractSectionData: SUBSCRIPTION;
    feeGroupId: number;
    clientId: number;
    tags: Tags;
    comments: string;
  },
  creatorId: number,
) {
  const newContract = await createContract(
    {
      clientId: contractInfo.clientId,
      feeGroupId: contractInfo.feeGroupId,
      contractSectionData: contractInfo.contractSectionData,
      tags: contractInfo.tags,
      comments: contractInfo.comments,
    },
    creatorId,
  );

  const contractDataSubscription = await GfContractDataSubscription.findOne({
    where: { contractId: newContract.id },
  });

  if (contractDataSubscription) {
    await contractDataSubscription.update(contractInfo.contractSectionData);
    return newContract;
  }

  await GfContractDataSubscription.create({
    contractId: newContract.id,
    ...contractInfo.contractSectionData,
  });

  return newContract;
};

const createContractWithSectionDataHandler = {
  INTERNET: createInternetContractWithSectionData,
  CELL: createCellContractWithSectionData,
  FIX: createFixContractWithSectionData,
  TV: createTvContractWithSectionData,
  SUBSCRIPTION: createSubscriptionContractWithSectionData,
};

export const createContractWithSection = async function (
  contractData: {
    contractSectionData: CONTRACT_TYPES;
    feeGroupId: number;
    tags: Tags;
    comments: string;
  },
  clientData: { clientId: number; packageStatusId: number; creatorId: number },
) {
  //check validations => client,feegroup section with contract data
  const section = await getSectionType({ feeGroupId: contractData.feeGroupId });
  if (
    !section ||
    !['INTERNET', 'FIX', 'TV', 'CELL', 'SUBSCRIPTION'].includes(section)
  ) {
    throw new errors.BadRequest(`fee group doesn't have valid section`);
  }
  const [error, contract] = await to(
    transaction(async () => {
      const newContract = await createContractWithSectionDataHandler[section](
        {
          //@ts-ignore
          contractSectionData: contractData.contractSectionData,
          feeGroupId: contractData.feeGroupId,
          clientId: clientData.clientId,
          tags: contractData.tags,
          comments: contractData.comments,
        },
        clientData.creatorId,
      );
      assert(newContract, 'contract is not created');

      await attachToPackageStatus(clientData.packageStatusId, newContract.id);
      return newContract;
    }),
  );

  if (error) throw error;

  return contract;
};

const createContract = async function (
  contractInfo: {
    contractSectionData: CONTRACT_TYPES;
    feeGroupId: number;
    clientId: number;
    tags: Tags;
    comments: string;
  },
  creatorId: number,
) {
  const { feeGroupId, clientId, tags, comments } = contractInfo;

  const newContractObject: Record<string, any> = {
    feeGroupId,
    clientId,
    comments,
  };

  if (hasRole('seller', creatorId, '')) newContractObject.sellerId = creatorId;

  const validator = await _validator(newContractObject, 'POST');

  ValidationException.throwUnless(await validator.check(), validator.errors);
  const contract = await GfContract.create(newContractObject);
  await attachTags(contract.id, tags ?? []);
  await onAfterInsert(contract, creatorId, true);
  return contract;
};

const attachTags = async (contractId: number, tags: Tags) => {
  await ContractTagMapping.bulkCreate(
    tags.map((tag) => ({
      gfContractId: contractId,
      contractTagId: tag.id,
      comment: tag.comment,
    })),
  );
};

const attachToPackageStatus = async function (
  packageStatusId: number,
  contractId: number,
) {
  await PackageStatusContract.create({ packageStatusId, contractId });
};

export const sync = async (contractId: number) => {
  const syncPackages: Promise<any>[] = [];
  const contract = await GfContract.findByPk(contractId, {
    include: [{ model: PackageStatusContract, as: 'package_statuses' }],
    group: ['package_statuses.packageStatusId'],
  });
  // doesn't have any package
  if (!contract) {
    console.error(
      `[SuggestDiscountService][sync] Failed sync discount for contract with id:${contractId}`,
    );
    return;
  }

  const packageStatuses = await PackageStatus.findAll({
    where: { id: pluck(contract.package_statuses, 'packageStatusId') },
    include: [{ model: GfContract, as: 'contracts' }],
  });

  for (const packageStatus of packageStatuses) {
    const state = generateFinalState(packageStatus.contracts);
    if (packageStatus.state !== state) {
      packageStatus.state = state;
      syncPackages.push(packageStatus.save());
    }
  }
  await Promise.all(syncPackages);
};

const generateFinalState = (contracts: AnyModel[]) => {
  let includePending = false;
  for (const contract of contracts) {
    const state = contract.state === 'block' ? 'active' : contract.state;
    if (state === 'pendingSectionsReady') includePending = true;
    if (state === 'suspended') return 'canceled';
  }
  if (includePending) return 'pending';
  return 'applied';
};
