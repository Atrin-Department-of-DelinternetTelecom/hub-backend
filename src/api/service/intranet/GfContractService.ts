import * as GfBonusService from './Fee/GfBonusService';
import * as GfContractDataCellService from './GfContractDataCellService';
import * as GfContractDataFixService from './GfContractDataFixService';
import * as GfContractDataInternetService from './GfContractDataInternetService';
import * as GfContractDataSubscriptionService from './GfContractDataSubscriptionService';
import * as GfContractDataTvService from './GfContractDataTvService';
import * as GfContractSectionStatusService from './GfContractSectionStatusService';
import * as GfDiscountsExecuteService from './GfDiscountsExecuteService';
import * as GfDiscountsPendingService from './GfDiscountsPendingService';
import * as GfFeeService from './Fee/GfFeeService';
import { putGfContractDataInternetsId } from '@service/intranet/GfContractDataInternetService';
import { updateFromContract } from '@api/service/intranet/RadiusService';

import { AnyModel, intranet, system } from '@api/models';
import {
  CDR_STATES,
  CELL_PROVIDER_CODE,
  SERVICE,
} from '@api/constants/contracts';
import { Request, Response } from 'express';
import _, { groupBy } from 'lodash';
import {
  findAllEntities,
  findAndDelete,
  findAndUpdate,
  getAllEntities,
} from '@utils/request-handler';
import { firstPopulated, throwUnless } from '@utils/helpers';
import { formatFileSize, formatTime } from '@api/utils/dates';
import {
  getContractSection as getContractSectionAlias,
  getFacadeBySectionCode,
  getSectionIdByCode,
} from './GfSectionService';
import { getProviderConditions, provider } from './Contract/helpers';
import moment, { Moment } from 'moment';
import {
  respondBadRequest,
  respondCreated,
  respondNotFound,
  respondOK,
  respondSuccess,
} from '@utils/response';
import { stateChanged, stateForcedToChange } from './GfCrmContractService';

import { ACS } from '@lib/sdk';
import { ACTION } from '@del-internet/sdk-cpe';
import { ActionEvent } from '@api/models/crud/crud_action_event';
import { AireAdditionalBono } from './AireService';
import { handle as ApplyFeePermanence } from './Actions/ApplyFeePermanence';
import { CONTRACT } from '@api/constants/statuses';
import { handle as ChangeHolder } from './Actions/ChangeHolder';
import { ContractInitialFee } from '@api/models/intranet/intranet_contract_initial_fee';
import { ContractTag } from '@api/models/intranet/intranet_contract_tag';
import { ContractTagMapping } from '@api/models/intranet/intranet_contract_tag_mapping';
import GeoGoufoneService from './GeoGoufoneService';
import { GfBonus } from '@api/models/intranet/intranet_gf_bonus';
import { GfBonusContractXref } from '@api/models/intranet/intranet_gf_bonus_contract_xref';
import { GfCellProviderFee } from '@api/models/intranet/intranet_gf_cell_providers_fees';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GfContractDataCell } from '@api/models/intranet/intranet_gf_contract_data_cell';
import { GfContractDataFix } from '@api/models/intranet/intranet_gf_contract_data_fix';
import { GfContractDataInternet } from '@api/models/intranet/intranet_gf_contract_data_internet';
import { GfContractDataSubscription } from '@api/models/intranet/intranet_gf_contract_data_subscription';
import { GfContractDataTv } from '@api/models/intranet/intranet_gf_contract_data_tv';
import GfContractsUnpaidService from './GfContractsUnpaidService';
import GfDiscountsService from './GfDiscountsService';
import { GfFee } from '@api/models/intranet/intranet_gf_fees';
import { GfFeeGroup } from '@api/models/intranet/intranet_gf_fee_groups';
import { GfSection } from '@api/models/intranet/intranet_gf_sections';
import { change as HandleChangeFeeGroupRequest } from './GfContractsFeeChangeService';
import { InitialFee } from '@api/models/intranet/intranet_initial_fee';
import { handle as MeiliSearchContractSync } from './Actions/MeiliSearchContractSync';
import { Op } from 'sequelize';
import OperadorFixFacade from './OperadorFixFacade';
import { Parser } from '@json2csv/plainjs';
import { handle as ProcessScheduledSuspensions } from './Actions/ProcessScheduledSuspensions';
import RadiusApiService from './RadiusApiService';
import { Static } from '@lib/cache';
import { handle as SuspendContracts } from './Actions/SuspendContracts';
import { SuspendingAction } from '@api/models/global/global_suspending_action';
import UnpaidContractService from '@service/unpaid/UnpaidContractService';
import { User } from '@api/models/global/global_users';
import ValidationException from '@lib/crud/Exceptions/ValidationException';
import actionRunner from '@lib/action-runner';
import assert from 'assert';
import config from '@config';
import { configureRadius } from './Contract/Actions/ConfigureRadius';
import { destroyIvozConnection } from './Contract/Actions/DestroyIvozConnection';
import { errors } from '@api/http/http_errors';
import { getBonos } from './FacadeCell';
import { getRadiusGroup } from './GfContractInternetService';
import { hasRole } from './AclService';
import { intranet as knex } from '@lib/knex';
import { lemon } from '@lib/lemon';
import niv from 'node-input-validator';
import { pluck } from '@api/utils/collections';
import { restoreContract } from './RadiusService';
import { revisionNumber as revisionAireLine } from './AireRevisionService';
import { revisionNumber as revisionLemonLine } from './LemonRevisionService';
import { sync } from './SuggestDiscountService';
import to from 'await-to-js';
import { writeFile } from '@api/utils/writer';

//todo (ali): move to right place
export type Tags = { id: number; comment: string }[];

const {
  GfCellProviderFeeBonus,
  GfClientContractCollaboratorHistory,
  GfContract,
  GfIvozFix,
  GfContractFeeChange,
  GfContractHolderChange,
  GfContractSectionStatus,
  GfFeegroupsGroupLabel,
  GfFeegroupsLabel,
  GfFeegroupsLabelsXref,
  GfFeegroupsSectionsXref,
  GfDiscountsExecuted,
  GfDiscountsMatrix,
  GfDiscountsScheduled,
  GfIncidence,
  GfScheduledInvoiceLine,
  GfUser,
  InvoiceClientsInvoiceProfile,
  GfContractUnpaid,
  GfCellProvider,
  GfBonusHistory,
  GfAireCdr2,
  GfKamailioUnifiedCdr,
  GfActiveFee,
  CrTask,
  UnpaidInvoice,
  transaction,
  InvoicePaymentType,
} = intranet;

const { Bulk, Action } = system;

const dateFormat = 'YYYY-MM-DD HH:mm:ss';

niv.extend(
  'GfContract/hasValidIban',
  async ({ value }: Record<string, any>) => {
    const client = await GfClient.findByPk(value, {
      include: {
        model: InvoicePaymentType,
        as: 'paymentType',
        required: false,
      },
    });

    if (client?.paymentType?.type !== 'Shipment') {
      return true;
    }

    return client?.hasValidBankData();
  },
);

niv.extend(
  'GfContract/isActiveClient',
  async ({ value }: Record<string, any>) => {
    const client = await GfClient.findByPk(value);

    return !!client?.active;
  },
);
niv.extend(
  'GfClient/hasNoUnpaidInvoice',
  async ({ value }: Record<string, any>) => {
    const unpaidInvoice = await UnpaidInvoice.findOne({
      where: { client_id: value, invoice_status: 'cutted' },
    });
    return unpaidInvoice === null;
  },
);

niv.extend('availableFeeGroup', async ({ value }: Record<string, any>) => {
  const conditions = await GfFeeService.getActualConditions(value);
  const sectionType = await getSectionType({ feeGroupId: value });

  return conditions && sectionType;
});

niv.extend('validTags', async ({ value }: Record<string, any>) => {
  const numberOfTags = await ContractTag.count({
    where: { id: (value as Tags).map((tag) => tag.id) },
  });

  return value.length === numberOfTags;
});

niv.extend(
  'sameConditions',
  async ({ value }: Record<string, any>, { inputs }: Record<string, any>) => {
    const conditions = await getActualConditionsBySection(inputs.contractId);

    return !conditions || conditions.feeGroupId !== value;
  },
);

niv.extend(
  'compatibleFees',
  async ({ value }: Record<string, any>, { inputs }: Record<string, any>) => {
    const conditions = await getActualConditionsBySection(inputs.contractId);

    if (conditions === null) return false;

    const oldXref = await GfFeegroupsSectionsXref.findOne({
      where: {
        feeGroupId: conditions.feeGroupId,
      },
    });
    const newXref = await GfFeegroupsSectionsXref.findOne({
      where: {
        feeGroupId: value,
      },
    });

    return newXref?.sectionId === oldXref?.sectionId;
  },
);

niv.extend(
  'pendingChange',
  async ({ value }: Record<string, any>, { inputs }: Record<string, any>) => {
    const pendingChange = await GfContractFeeChange.findOne({
      where: {
        contractId: inputs.contractId,
        done: 0,
      },
    });

    return pendingChange === null;
  },
);

// niv.extend('isSeller', async ({ value }: Record<string, any>) => {
//   return await GfUser.findByPk(value) !== null
// });

niv.extend(
  'oldClient',
  async ({ value }: Record<string, any>, { inputs }: Record<string, any>) => {
    const contract = await GfContract.findByPk(inputs.contractId);

    return contract === null || contract.clientId !== value;
  },
);

niv.extend(
  'oldFeeGroup',
  async ({ value }: Record<string, any>, { inputs }: Record<string, any>) => {
    const contract = await GfContract.findByPk(inputs.contractId);

    return contract === null || contract.feeGroupId !== value;
  },
);

niv.extend(
  'forceState',
  async ({ value }: Record<string, any>, { inputs }: Record<string, any>) => {
    const contract = await GfContract.findByPk(inputs.contractId);

    if (contract === null) return true;

    return value === 'pending'
      ? contract.isActive() || contract.isSuspended()
      : contract.isPendingSectionsReady();
  },
);

/**
 * delete a category record by id
 **/
export const deleteGfContractsId = async (id: number) => {
  return findAndDelete(id, GfContract);
};

/**
 * soft delete proccess
 **/
export const destoryGfContractsId = async (contractId: number, user: User) => {
  const contract = await GfContract.findByPk(contractId);
  assert(contract, `${GfContract.name} with id:${contractId} not found.`);
  assert(
    contract.isPendingSectionsReady(),
    `You have to use suspending process.`,
  );
  await SuspendContracts([contract], user.userId);
  await deleteScheduledInvoiceLines(contract.id);
  await contract.update({ status: 0 });
  await CrTask.update(
    { status: 0 },
    { where: { altIdType: 'gf_contracts', altId: contractId } },
  );

  await ActionEvent.forResourceDelete({
    userId: user.id,
    resource: contract,
  }).markAsFinished();

  return respondOK(`${GfContract.name} with id:${contractId} has been deleted`);
};

export const checkLinkedContract = async (
  contractId: number,
  type: string,
  state: string,
) => {
  if (type !== SERVICE.INTERNET) {
    return { success: true };
  }

  // check if there are a linked contract
  // @ts-ignore
  const contracts: AnyModel[] = await GfContract.selectFromInternetId(
    contractId,
  );
  // @ts-ignore
  const linkedContracts: AnyModel[] = await GfContract.linkedContracts(
    contractId,
  ).findAll();

  if (contracts.length > 0 && linkedContracts.length !== 1) {
    return {
      success: false,
      reason:
        linkedContracts.length > 1
          ? 'More than one contracts linked to this'
          : 'There are fix contracts vinculed to this internet',
    };
  }

  // move fixes to the new contract
  await GfContractDataFix.update(
    { internetSectionId: linkedContracts[0].id },
    {
      where: {
        contractId: contracts.map(({ id }) => id),
        state: { [Op.not]: CONTRACT.SUSPENDED },
      },
    },
  );

  return { success: true };
};

const deleteScheduledInvoiceLines = async function (contractId: number) {
  // delete contracts row
  await GfScheduledInvoiceLine.update({ status: 0 }, { where: { contractId } });
};

/**
 * Your GET endpoint
 **/
export const getGfContracts = async function (query: Record<string, any>) {
  const res = await getAllEntities(
    query,
    GfContract,
    { reference: { [Op.notLike]: '%-aireLink' } },
    [
      {
        model: GfFeeGroup,
        as: 'fee_group',
        attributes: ['id', 'name', 'internalName', 'type', 'provider'],
        include: [
          {
            model: GfSection,
            as: 'sections',
            required: false,
            attributes: ['id', 'name', 'code'],
          },
          {
            model: GfActiveFee,
            as: 'gf_active_fee',
            required: false,
            attributes: ['cellProviderId'],
            include: [
              {
                model: GfCellProvider,
                as: 'cellProvider',
                required: false,
                attributes: ['code'],
              },
            ],
          },
        ],
        required: false,
      },
      {
        model: GfContractDataCell,
        as: 'dataCell',
        required: false,
      },
      {
        model: GfContractDataTv,
        as: 'dataTv',
        required: false,
      },
      {
        model: GfContractDataFix,
        as: 'dataFix',
        required: false,
        include: [
          {
            model: GfContractDataInternet,
            as: 'dataInternet',
            required: false,
          },
        ],
      },
      {
        model: GfContractDataInternet,
        as: 'dataInternet',
        required: false,
        include: [
          {
            model: GfContractDataFix,
            as: 'dataFixes',
            required: false,
            include: {
              model: GfContract,
              as: 'contract',
              required: true,
              where: { state: { [Op.not]: 'suspended' } },
            },
          },
        ],
      },
      {
        model: GfContractSectionStatus,
        as: 'statuses',
        required: false,
        attributes: ['id', 'state', 'pendingState', 'lastError'],
        include: [
          {
            model: GfSection,
            as: 'section',
            required: false,
            attributes: ['id', 'name', 'code'],
          },
        ],
      },
      {
        model: GfBonus,
        as: 'bonuses',
        required: false,
        attributes: ['id', 'name', 'internalName'],
      },
      {
        model: GfUser,
        as: 'seller',
        required: false,
        attributes: ['id', 'userId', 'name'],
      },
      {
        model: GfClient,
        as: 'client',
        required: false,
        attributes: [
          'id',
          'fiscalId',
          'active',
          'name',
          'contactName',
          'contactFamilyName1',
          'contactFamilyName2',
        ],
      },
    ],
  );

  const contracts = res.unwrap().map(({ id }: Record<string, unknown>) => id);

  const [discounts, incidences, matrix, tags] = await Promise.all([
    GfDiscountsScheduled.findAll({
      where: { contractId: contracts },
      raw: true,
    }),
    GfIncidence.findAll({
      where: { contractId: contracts, closed: 0 },
      raw: true,
    }),
    GfDiscountsExecuted.findAll({
      where: { targetContractId: contracts },
      include: [
        {
          model: GfDiscountsMatrix,
          as: 'matrix',
          required: false,
        },
      ],
      raw: true,
      nest: true,
    }),
    ContractTag.findAll({
      include: [
        {
          model: ContractTagMapping,
          required: true,
          where: { gf_contract_id: contracts },
        },
      ],
    }),
  ]);

  const executed = groupBy(matrix, 'targetContractId');
  const openIncidences = groupBy(incidences, 'contractId');
  const schedules = groupBy(discounts, 'contractId');

  return res.replace(
    res.unwrap().map((data: AnyModel) => {
      return {
        ...data.toJSON(),
        open_incidences: openIncidences[data.id] ?? [],
        executed: executed[data.id] ?? [],
        discounts: schedules[data.id] ?? [],
        tags: tags.filter((tag) =>
          tag.ContractTagMappings?.find(
            ({ gf_contract_id }) => gf_contract_id === data.id,
          ),
        ),
      };
    }),
  );
};

/**
 * Your GET endpoint
 **/
export const syncGfContracts = async function () {
  await MeiliSearchContractSync();

  return respondSuccess({});
};

/**
 * Your GET endpoint
 **/
export const getGfContractsId = async function (id: number) {
  const contract = await GfContract.findByPk(id, {
    include: [
      {
        model: GfFeeGroup,
        as: 'fee_group',
        include: [
          {
            model: GfSection,
            as: 'sections',
            required: false,
          },
          {
            model: GfFee,
            as: 'gf_fees',
            required: false,
          },
          {
            model: GfActiveFee,
            as: 'gf_active_fee',
            required: false,
          },
        ],
        required: false,
      },
      {
        model: GfContractDataCell,
        as: 'dataCell',
        required: false,
        include: [
          {
            model: GfCellProviderFeeBonus,
            as: 'bonuses',
            required: false,
          },
        ],
      },
      {
        model: GfIncidence,
        as: 'open_incidences',
        required: false,
      },
      {
        model: GfContractDataFix,
        as: 'dataFix',
        required: false,
        include: [
          {
            model: GfContractDataInternet,
            as: 'dataInternet',
            required: false,
          },
        ],
      },
      {
        model: GfContractDataInternet,
        as: 'dataInternet',
        required: false,
        include: [
          {
            model: GfContractDataFix,
            as: 'dataFixes',
            required: false,
          },
        ],
      },
      {
        model: GfContractSectionStatus,
        as: 'statuses',
        required: false,
      },
      {
        model: GfClient,
        as: 'client',
        required: false,
      },
      {
        model: GfContract,
        as: 'linkedContract',
        required: false,
      },
      {
        model: GfBonus,
        as: 'bonuses',
        required: false,
      },
      {
        model: GfDiscountsScheduled,
        as: 'discounts',
        required: false,
      },
      {
        model: GfUser,
        as: 'seller',
        required: false,
      },
      {
        model: InvoiceClientsInvoiceProfile,
        as: 'invoiceProfile',
        required: false,
      },
      {
        model: GfContractUnpaid,
        as: 'blocks',
        required: false,
        order: [['id', 'desc']],
      },
      {
        model: ContractTag,
        as: 'tags',
        required: false,
      },
      {
        model: InitialFee,
        required: false,
      },
    ],
  });

  if (!contract) {
    throw new errors.NotFound(`Contract with id ${id} not found`);
  }

  const [error, cellProvider] = await to(provider(contract.id));

  return respondSuccess({
    ...contract.toJSON(),
    provider: cellProvider,
  });
};

/**
 *
 * add a category record
 **/
export const postGfContracts = async function (
  body: Record<string, any>,
  user: User,
) {
  const [error, condition] = await to(getProviderConditions(body.feeGroupId));

  if (!error && condition.provider.code === CELL_PROVIDER_CODE.LEMON) {
    await validateLemonClient(body.clientId);
  }

  const validator = await _validator({ ...body }, 'POST');
  body.userId = user.userId;

  if (hasRole('seller', body.userId, '')) {
    body.sellerId = body.userId;
  }

  if (!body.collaboratorId) {
    //@ts-ignore
    body.collaboratorId = user.collaboratorId;
  }

  ValidationException.throwUnless(await validator.check(), validator.errors);

  const contract = await transaction<AnyModel>(async () => {
    const contract = await GfContract.create(body);
    await Promise.all([
      syncInitialFees(contract, body.initialFee),
      syncTags(contract, body.tags ?? []),
      onAfterInsert(contract, body.userId, true),
    ]);

    return contract;
  });

  await ActionEvent.forResourceCreate({
    payload: body,
    userId: user.id,
    resource: contract,
  }).markAsFinished();

  return respondCreated(contract);
};

export const validateLemonClient = async (clientId: number) => {
  const client = await GfClient.findByPk(clientId);
  assert(
    client,
    `[GfContract][validateLemonClient] Client with id:${clientId} not found`,
  );

  const [error] = await to(lemon.client.checkClient(client.fiscalId));

  if (error === null) {
    return;
  }

  await Promise.race([
    client.lemonCity(),
    client.lemonProvince(),
    client.lemonRegion(),
  ]);
};

export const putGfContractsId = async function (
  body: Record<string, any>,
  id: number,
  user: User,
) {
  const userId: number = user.userId;
  const validator = await _validator({ ...body }, 'PUT', id);
  const model = await GfContract.findByPk(id, {
    include: { model: InitialFee, required: false },
  });
  assert(
    model,
    new errors.NotFound(`${GfContract.name} with id:${id} not found`),
  );

  if (hasRole('seller', userId, '') && !model.sellerId) {
    body.sellerId = userId;
  }

  ValidationException.throwUnless(await validator.check(), validator.errors);

  if (body.feeGroupId) delete body.feeGroupId;

  return findAndUpdate(id, body, GfContract).then(async (response) => {
    if (response.payload.code === 200) {
      const contract = response.payload.data;
      const scopeContract = { where: { gf_contract_id: id } };

      await Promise.all([
        syncInitialFees(contract, body.initialFee),
        syncTags(contract, body.tags ?? []),
        ActionEvent.forResourceUpdate({
          payload: body,
          resource: contract,
          original: model,
          userId: user.id,
        }).markAsFinished(),
        onAfterUpdate(model, userId),
      ]);
    }

    return response;
  });
};

const syncInitialFees = async (
  contract: AnyModel,
  data?: Record<string, unknown>,
) => {
  const initialFee: Record<string, unknown> = {
    start_date: null,
    end_date: null,
    installments: null,
    discount: null,
    ...data,
  };

  await ContractInitialFee.destroy({
    where: {
      gf_contract_id: contract.id,
      initial_fee_id: { [Op.not]: initialFee.initial_fee_id ?? '' },
    },
  });

  if (!Number(initialFee.initial_fee_id)) {
    return;
  }

  const [count] = await ContractInitialFee.update(initialFee, {
    where: { gf_contract_id: contract.id },
  });

  if (count === 0) {
    await ContractInitialFee.create({
      ...initialFee,
      gf_contract_id: contract.id,
    });
  }
};

const syncTags = async (
  contract: AnyModel,
  tags: Record<string, unknown>[],
) => {
  await ContractTagMapping.destroy({ where: { gf_contract_id: contract.id } });

  return ContractTagMapping.bulkCreate(
    tags.map(({ id, comment }) => {
      return {
        gf_contract_id: contract.id,
        contract_tag_id: id,
        comment,
      };
    }),
  );
};

/**
 * Update DiscountsExecuted dates for the given contract id;
 **/
export const updateDiscountsExecuted = async function (
  contractId: number,
  oldDate: string,
  newDate: string,
) {
  const discounts = await GfDiscountsExecuted.findAll({
    where: {
      targetContractId: contractId,
    },
  });

  for (const index in discounts) {
    if (discounts[index].init === oldDate) {
      await discounts[index].update({ init: newDate });
    }
  }
};

/**
 * update a category record by id
 **/
export const changeHolder = async function (
  contractId: number,
  body: Record<string, any>,
  userId: number,
) {
  const validator = new niv.Validator(
    { contractId, ...body },
    {
      clientId:
        'required|GfContract/hasValidIban|GfContract/isActiveClient|oldClient|existsOnIntranet:GfClient',
      contractId: 'existsOnIntranet:GfContract',
    },
    {
      'GfContract/hasValidIban': `${GfClient.name} with id:${body.clientId} has invalid bank data`,
      'GfContract/isActiveClient': `${GfClient.name} with id:${body.clientId} is not activate yet`,
      oldClient: 'This client holding this contract',
    },
  );

  ValidationException.throwUnless(await validator.check(), validator.errors);

  await ChangeHolder({
    clientId: body.clientId,
    contractId,
    userId,
  });

  return getGfContractsId(contractId);
};

export const changeFeeGroup = async function (
  contractId: number,
  body: Record<string, any>,
  userId: number,
) {
  const { feeGroupId, previsionDate, executedDate } = body;

  const validator = new niv.Validator(
    { contractId, ...body },
    {
      contractId: 'required|existsOnIntranet:GfContract',
      feeGroupId:
        'required|existsOnIntranet:GfFeeGroup|oldFeeGroup|availableFeeGroup|sameConditions|compatibleFees|pendingChange',
    },
    {
      oldFeeGroup: 'This contract holding this fee',
      availableFeeGroup: `fee-group with id:${feeGroupId} not available`,
      sameConditions: `Same conditions, no change needed`,
      compatibleFees: 'Incompatible fees (different section type)',
      pendingChange: 'A pending fee change is active',
    },
  );

  ValidationException.throwUnless(await validator.check(), validator.errors);

  await HandleChangeFeeGroupRequest({
    contractId,
    feeGroupId,
    userId,
    previsionDate: moment(previsionDate),
    executedDate: moment(executedDate),
  });

  return getGfContractsId(contractId);
};

export const bulkChangeFeeGroup = async function (
  {
    fromFeeGroupId,
    toFeeGroupId,
    template,
    notificationType,
    skipChangeFeeGroup,
    previsionDate,
    executedDate,
  }: Record<string, any>,
  userId: number,
  systemUserId: number,
) {
  if (skipChangeFeeGroup === true && !template) {
    return respondBadRequest(
      'Template is required when skipChangeFeeGroup is true',
    );
  }

  const toFeeGroup = await GfFeeGroup.findOne({
    where: {
      id: toFeeGroupId,
      status: 1,
      active: 1,
    },
  });

  if (!toFeeGroup) {
    return respondNotFound(
      `${GfFeeGroup.name} with id:${toFeeGroupId} not found`,
    );
  }

  const fromFeeGroup = await GfFeeGroup.findOne({
    where: {
      id: fromFeeGroupId,
    },
  });

  if (!fromFeeGroup) {
    return respondNotFound(
      `${GfFeeGroup.name} with id:${fromFeeGroupId} not found`,
    );
  }

  const pendingChangeFeeBulks = await Bulk.findAll({
    where: {
      name: 'change-fee-group',
      status: 'running',
    },
  });

  for (const bulk of pendingChangeFeeBulks) {
    if (
      bulk.params.fromFeeGroupId === fromFeeGroupId ||
      bulk.params.toFeeGroupId === toFeeGroupId ||
      bulk.params.fromFeeGroupId === toFeeGroupId ||
      bulk.params.toFeeGroupId === fromFeeGroup
    ) {
      return respondNotFound(
        'Another running bulk fee change is working on these fee groups',
      );
    }
  }

  const contracts = await GfContract.findAll({
    where: {
      feeGroupId: fromFeeGroupId,
      state: 'active',
    },
    include: [
      {
        model: GfClient,
        as: 'client',
      },
    ],
  });

  if (!contracts.length) {
    return respondNotFound(
      `${GfContract.name} with feeGroupId:${fromFeeGroupId} not found`,
    );
  }

  const actions = contracts.map((contract) => {
    return {
      name: 'change-fee-group',
      params: {
        id: contract.id,
        feeGroupId: toFeeGroupId,
        userId,
        systemUserId,
        clientId: contract.clientId,
        clientName: contract.client.name,
      },
    };
  });

  const { id: bulkId } = await actionRunner.createBulk(
    {
      creator_id: systemUserId,
      name: 'change-fee-group',
      params: {
        template,
        fromFeeGroupId,
        toFeeGroupId,
        fromFeeGroupName: fromFeeGroup.name,
        toFeeGroupName: toFeeGroup.name,
        notificationType,
        skipChangeFeeGroup,
        previsionDate: moment(previsionDate).toISOString(),
        executedDate: moment(executedDate).toISOString(),
      },
    },
    actions,
  );

  return respondCreated({
    totalContracts: actions.length,
    bulkId,
    fromFeeGroupId,
    toFeeGroupId,
    fromFeeGroupName: fromFeeGroup.name,
    toFeeGroupName: toFeeGroup.name,
  });
};

export const revertBulkChangeFeeGroup = async function (
  { bulkId }: Record<string, any>,
  userId: number,
) {
  await actionRunner.stopBulk(bulkId);

  const originalBulk = await Bulk.findByPk(bulkId);
  assert(originalBulk);

  if (originalBulk.params.isReverted) {
    return respondBadRequest(`this bulk is already reverted`);
  }

  const toFeeGroupId = originalBulk.params.fromFeeGroupId; // swap the fee groups
  const fromFeeGroupId = originalBulk.params.toFeeGroupId; // swap the fee groups

  const toFeeGroupName = originalBulk.params.fromFeeGroupName; // swap the fee groups
  const fromFeeGroupName = originalBulk.params.toFeeGroupName; // swap the fee groups

  const actions = await Action.findAll({
    where: {
      bulk_id: bulkId,
      status: 'fulfilled',
    },
  });

  if (!actions.length) {
    return respondNotFound(`there is no action to revert for bulk:${bulkId}`);
  }

  originalBulk.params.isReverted = true;
  await originalBulk.save();

  const revertActions = actions.map((action) => {
    return {
      name: 'change-fee-group',
      params: {
        id: action.params.id,
        feeGroupId: toFeeGroupId,
        userId,
        clientId: action.params.clientId,
        clientName: action.params.clientName,
      },
    };
  });

  const newBulk = await actionRunner.createBulk(
    {
      creator_id: userId,
      name: 'change-fee-group',
      params: {
        fromFeeGroupId,
        toFeeGroupId,
        fromFeeGroupName,
        toFeeGroupName,
        notificationType: 'perContract',
        isRevertBulk: true,
      },
    },
    revertActions,
  );

  return respondCreated({
    totalContracts: revertActions.length,
    bulkId: newBulk.id,
    fromFeeGroupId,
    toFeeGroupId,
    fromFeeGroupName,
    toFeeGroupName,
  });
};

/**
 * update a category record by id
 **/
export const forceState = async (
  { state }: Record<string, unknown>,
  id: number,
  user: User,
) => {
  const validator = new niv.Validator(
    { contractId: id, state },
    { state: 'in:done,pending|forceState' },
    { forceState: 'Invalid contract state' },
  );

  ValidationException.throwUnless(await validator.check(), validator.errors);

  const contract = await GfContract.findByPk(id);
  assert(contract, `${GfContract.name} with id:${id} not found`);

  const {
    //@ts-ignore
    section: { status },
  } = await GfContractSectionStatusService.findForContract(id)!;
  // update state
  await GfContractSectionStatusService[
    state === 'done' ? 'setDoneState' : 'setPendingState'
  ](id, status.sectionId, user.userId);

  await ActionEvent.forAction({
    payload: { state },
    resource: contract,
    action: 'Force State',
    userId: user.id,
  }).markAsFinished();

  await stateForcedToChange(
    contract.id,
    state === 'done' ? CONTRACT.ACTIVE : CONTRACT.PENDING_SECTION_READY,
    user.userId,
  );

  return getGfContractsId(id);
};

/**
 * change holder of a contract
 **/
export const updateState = async function (contractId: number, userId: number) {
  let allOk = true;
  let allSuspended = true;
  let allBlocked = true;
  const contract = await GfContract.findByPk(contractId, {
    include: [
      {
        model: GfFeeGroup,
        as: 'fee_group',
        required: true,
        include: [
          {
            model: GfSection,
            as: 'sections',
            required: true,
          },
        ],
      },
    ],
  });

  assert(
    contract,
    `[GfContractService][updateState] Contract with id:${contractId} not found`,
  );
  if (
    contract.isPendingChange() ||
    (!contract.isFrozen() &&
      contract.isSuspended() &&
      contract.type !== SERVICE.CELL)
  ) {
    return;
  }

  // TODO(erfan): use for of syntax
  for (const index in contract.fee_group.sections) {
    const section = contract.fee_group.sections[index];
    const { state } = await GfContractSectionStatusService.getState(
      contractId,
      section.id,
    );

    if (state !== 'done') {
      allOk = false;
    }
    if (state !== 'suspended') {
      allSuspended = false;
    }
    if (state !== 'blocked') {
      allBlocked = false;
    }
  }

  if (allOk) return setState(contract, CONTRACT.ACTIVE, userId);
  else if (allSuspended) return setState(contract, CONTRACT.SUSPENDED, userId);
  else if (allBlocked) return setState(contract, CONTRACT.BLOCKED, userId);
  else return setState(contract, CONTRACT.PENDING_SECTION_READY, userId);
};

/**
 * Create new validator instance.
 */
export const _validator = function (
  body: Record<string, any>,
  method?: string,
  id?: number,
) {
  body.dateActivation = body.dateActivation || null;
  body.dateDeactivation = body.dateDeactivation || null;
  body.permanenceEnd = body.permanenceEnd || null;
  body.initialFee = {
    start_date: firstPopulated([body.initialFee?.start_date]),
    end_date: firstPopulated([body.initialFee?.end_date]),
    installments: firstPopulated([body.initialFee?.installments]),
    discount: firstPopulated([body.initialFee?.discount]),
  };
  // body.sellerId = body.sellerId || null;
  body.percentageDiscount = body.percentageDiscount || null;

  return new niv.Validator(body, _validationRules(body.formName, method, id), {
    'GfContract/hasValidIban': `${GfClient.name} with id:${body.clientId} has invalid bank data.`,
    'GfContract/isActiveClient': `${GfClient.name} with id:${body.clientId} is not activated yet.`,
    'GfClient/hasNoUnpaidInvoice': `${GfClient.name} with id:${body.clientId} has unpaid invoice`,
    isSeller: 'The sellerId not exists',
    availableFeeGroup: `${GfFeeGroup.name} with id:${body.feeGroupId} not available`,
    validTags: `invalid tag ids`,
  });
};

/**
 * Get validation rules.
 */
function _validationRules(formName: string, method?: string, id?: number) {
  const rules = {
    clientId: 'sometimes|GfContract/hasValidIban|GfContract/isActiveClient',
    feeGroupId: 'sometimes|existsOnIntranet:GfFeeGroup|availableFeeGroup',
    tags: 'sometimes|validTags',
    // sellerId: 'nullable|isSeller',
    payDay: 'max:31|min:1',
    dateActivation: 'nullable|dateiso',
    dateDeactivation: 'nullable|dateiso',
    permanenceEnd: 'nullable|dateiso',
    invoiceMonths: 'in:1001,1002,1003,1006,1012,1,2,3,6,12',
    percentageDiscount: 'nullable|min:0|max:100',
    'initialFee.initial_fee_id': 'sometimes|existsOnIntranet:InitialFee',
    'initialFee.start_date': 'nullable|date',
    'initialFee.end_date': 'nullable|date',
    'initialFee.installments': 'nullable|integer|min:0',
  };
  if (method === 'POST') {
    rules.clientId += '|GfClient/hasNoUnpaidInvoice';
  }
  return rules;
}

/**
 * Ensure that contract has section row.
 */
export const ensureHasSection = async function (
  contract: AnyModel,
  userId: number,
) {
  const sectionType = await getSectionType(contract);
  const model = getModelForSectionType(sectionType);

  if (!model) {
    return setState(contract, CONTRACT.PENDING_SECTION_READY, userId);
  }

  const [instance, created] = await model.findOrCreate({
    where: { contractId: contract.id },
    defaults: { contractId: contract.id },
  });

  if (sectionType === SERVICE.INTERNET) {
    // if is internet section sets default cpeLineProfile
    await getCpeLineProfile(contract.feeGroupId).then(
      async (cpeLineProfile?: string) => {
        await instance.update({
          cpeLineProfile: cpeLineProfile
            ? cpeLineProfile
            : //@ts-ignore
              instance.cpeLineProfile,
        });
      },
    );
  }

  if (!created) {
    return setState(contract, CONTRACT.PENDING_SECTION_READY, userId);
  }

  // set section state
  const section = await GfSection.findByCode(sectionType);

  await GfContractSectionStatusService.setEmptyState(
    contract.id,
    section.id,
    userId,
  );

  if (sectionType === SERVICE.FIX) {
    GfContractDataFixService.ensureOfPortabilityDocument(instance.contractId);
  }
  // no need to wait for any thing
  if (sectionType === SERVICE.SUBSCRIPTION) {
    await GfContractSectionStatusService.setDoneState(
      contract.id,
      section.id,
      userId,
    );
    await setState(contract, CONTRACT.ACTIVE, userId);
  } else {
    return setState(contract, CONTRACT.PENDING_SECTION_READY, userId);
  }
};

/**
 * Get type of the first section.
 */
export const getSectionType = async function (
  contract: AnyModel | { feeGroupId: number },
): Promise<SERVICE> {
  const sections = await GfSection.findAll({
    attributes: ['id', 'code', 'status', 'uid'],
    include: {
      model: GfFeeGroup,
      as: 'feeGroups',
      required: true,
      attributes: ['id', 'status', 'uid'],
      where: { id: contract.feeGroupId },
    },
  });

  return sections[0]?.code;
};

/**
 * Get model name by section type.
 */
export const getModelForSectionType = function (sectionType: string) {
  return {
    CELL: GfContractDataCell,
    TV: GfContractDataTv,
    INTERNET: GfContractDataInternet,
    FIX: GfContractDataFix,
    SUBSCRIPTION: GfContractDataSubscription,
  }[String(sectionType).toUpperCase()];
};

/**
 * Get model name by section type.
 *
 * @param  {string} service
 * @return {Object}
 */
export const getServiceForSectionType = function (service: SERVICE) {
  const services: Record<SERVICE, any> = {
    INTERNET: GfContractDataInternetService,
    CELL: GfContractDataCellService,
    FIX: GfContractDataFixService,
    TV: GfContractDataTvService,
    SUBSCRIPTION: GfContractDataSubscriptionService,
  };

  throwUnless(services[service], `Service not found for type '${service}'`);

  return services[service];
};

/**
 * Get cpeLineProfile for given feeGroupId.
 */
export const getCpeLineProfile = async function (feeGroupId: number) {
  const conditions = await GfFeeService.getActualConditions(feeGroupId);

  return conditions ? conditions.internetDefaultCpeLineProfile : null;
};

/**
 * Set state for the given contract
 */
export const setState = async function (
  contract: AnyModel,
  state: CONTRACT,
  userId: number,
  force = false,
) {
  if (contract.state === state && force === false) return;

  // TODO
  // start transaction

  const isBlocked = await UnpaidContractService.isContractBlocked(contract.id);
  let comeFromUnblock = false;

  if (isBlocked && state !== CONTRACT.BLOCKED) {
    comeFromUnblock = true;
    await UnpaidContractService.setOriginalStates(contract.id, state);
  }

  if (!isBlocked || [CONTRACT.SUSPENDED, CONTRACT.BLOCKED].includes(state)) {
    contract.state = state;
  }

  if (
    state === CONTRACT.ACTIVE &&
    (!contract.dateActivation || !moment(contract.dateActivation).isValid())
  ) {
    contract.dateActivation = moment().format('YYYY-MM-DD HH:mm:ss');
  }

  if (
    state === CONTRACT.SUSPENDED &&
    (!contract.dateDeactivation || !moment(contract.dateDeactivation).isValid())
  ) {
    contract.dateDeactivation = moment().format('YYYY-MM-DD HH:mm:ss');
  }

  await contract.save();
  await applyDiscountsOrCharges(contract, state, comeFromUnblock, userId);
  await sync(contract.id);
  await stateChanged(contract.id, state, userId);
  // TODO
  // end transction
  return { success: true };
};

/**
 * Apply possibles discounts or charges
 */
export const applyDiscountsOrCharges = async function (
  contract: AnyModel,
  state: string,
  comeFromUnblock: boolean,
  userId: number,
) {
  // TODO: read from config
  const ENABLE_DISCOUNTS = true;
  const ENABLE_INITIAL_FEE_CHARGE = true;
  const contractDown = ENABLE_DISCOUNTS;

  if (state === CONTRACT.SUSPENDED && contractDown) {
    await ApplyFeePermanence(contract, userId);
    await GfDiscountsExecuteService.onContractDown(
      contract.id,
      undefined,
      userId,
    );
  }

  if (state === CONTRACT.SUSPENDED) {
    return cancelAllSections(contract.id, false, userId);
  } else if (state !== CONTRACT.ACTIVE) {
    return;
  }

  if (!comeFromUnblock && ENABLE_DISCOUNTS) {
    await GfDiscountsPendingService.updateAllFromClient(
      contract.clientId,
      undefined,
      undefined,
      false,
      userId,
    );
  }

  // apply initial contract cost
  if (contract.imported !== 1 && ENABLE_INITIAL_FEE_CHARGE) {
    await GfDiscountsService.applyFeeInitialCharge(contract);
  }

  // suspend old contract
  if (contract.linkedContractId) {
    const linkedContract = await GfContract.findByPk(contract.linkedContractId);
    assert(
      linkedContract,
      `Missing linked contract for contract ${contract.id}`,
    );
    const suspension = SuspendingAction.forChangingTechnology(
      linkedContract,
      userId,
    );
    await ProcessScheduledSuspensions([await suspension.save()]);
  }
};

export const cancelAllSections = async function (
  contractId: number,
  noFacade = false,
  userId: number,
) {
  const sections = await GfContractSectionStatusService.getAllForContract(
    contractId,
  );

  for (const sectionCode in sections) {
    const row = sections[sectionCode as SERVICE]?.row as AnyModel;

    if (!noFacade) {
      const facade = getFacadeBySectionCode(sectionCode);
      await facade.down(row.contractId, userId);
    }

    await GfContractSectionStatusService.setSuspendedState(
      contractId,
      await getSectionIdByCode(sectionCode),
      userId,
    );
  }
};

/**
 * update a category record by id
 **/
export const addBonus = async function (
  id: number,
  bonusId: number,
  ip: string,
  userId: number,
) {
  const contract = await GfContract.findByPk(id);
  const bonus = await GfBonus.findByPk(bonusId);

  assert(contract, `${GfContract.name} with id:${id} not found`);
  assert(bonus, `${GfBonus.name} with id:${bonusId} not found`);

  if (bonus.internetIpFix === 1) {
    const attached = await GfBonusContractXref.findOne({
      where: { contractId: id },
      include: [
        {
          model: GfBonus,
          as: 'bonus',
          required: true,
          where: { internetIpFix: 1 },
        },
      ],
    });

    ValidationException.throwUnless(
      attached === null,
      `${GfContract.name} with id:${id} already have a bonus with static ip.`,
    );

    const validator = new niv.Validator({ ip: ip }, { ip: 'required|ip' });

    ValidationException.throwUnless(await validator.check(), validator.errors);
  }

  await GfBonusService.addBonus(id, bonusId, false, false, ip, userId);
  await GfDiscountsPendingService.updateAllFromClient(
    contract.clientId,
    undefined,
    undefined,
    false,
    userId,
  );
  return respondOK('Bono added');
};

/**
 *
 * update a category record by id
 **/
export const removeBonus = async function (
  id: number,
  bonusId: number,
  userId: number,
) {
  const xref = await GfBonusContractXref.findOne({
    where: {
      bonoId: bonusId,
      contractId: id,
    },
  });

  await GfBonusService.removeBonus(xref!.id, false, false, userId);

  return respondOK('Bono removed');
};

export const getActualConditionsBySection = async (contractId: number) => {
  const contract = await GfContract.findByPk(contractId);
  assert(contract);
  return GfFeeService.getActualConditions(contract.feeGroupId);
};

/**
 * Get available bonuses for given contract id
 **/
export const getAvailableBonos = async function (contractId: number) {
  const conditions = await getActualConditionsBySection(contractId);
  if (!conditions) return [];
  return GfBonusService.getBonosForFeeGroup(conditions.feeGroupId);
};

/**
 *
 * Get type of given contract id
 **/
export const getContractSectionType = async function (contractId: number) {
  const { type } = await GfContractSectionStatusService.findForContract(
    contractId,
  );

  return type;
};

export const getFromClient = async function (
  clientId: number,
  withDiscounts = false,
  hideSuspended = true,
  withBonus = false,
  unpaidRow = false,
  fullSection = false,
  localBonus = false,
) {
  const contracts = await GfContract.findAll({
    where: { clientId },
  });

  return Promise.all(
    contracts
      .filter((contract) => !contract.isSuspended() || !hideSuspended)
      .map((contract) => {
        return hydrateContract(
          contract,
          withDiscounts,
          hideSuspended,
          withBonus,
          unpaidRow,
          fullSection,
          localBonus,
        );
      }),
  );
};

export const hydrateContract = async function (
  contract: AnyModel,
  withDiscounts = false,
  hideSuspended = true,
  withBonus = false,
  unpaidRow = false,
  fullSection = false,
  localBonus = false,
) {
  contract.fee = await GfFeeGroup.findByPk(contract.feeGroupId);

  const sections = await GfSection.findAll({
    include: [
      {
        model: GfFeeGroup,
        as: 'feeGroups',
        required: true,
        through: {
          where: {
            feeGroupId: contract.feeGroupId,
          },
        },
      },
    ],
  });

  const contractSections: Array<
    AnyModel & {
      code: string;
      name: string;
      state: string;
      pendingState: string;
      reference2: string;
    }
  > = [];

  for (const item in sections) {
    const section = sections[item];
    const contractSection = await getContractSectionAlias(
      contract.id,
      section.code,
    );
    // @ts-ignore
    contractSections[item] = contractSection ? contractSection : {};
    contractSections[item].code = section.code;
    contractSections[item].name = _.capitalize(_.lowerCase(section.code));

    const { state, pendingState } =
      await GfContractSectionStatusService.getState(contract.id, section.id);
    contractSections[item].state = state;
    contractSections[item].pendingState = pendingState;

    let reference = await GfContractSectionStatusService.getReference(
      contractSections[item],
      section.code,
      true,
    );
    const references = String(reference).split('|');

    if (references.length > 1) {
      const parts = references[1].split(',');
      reference =
        "<hr style='margin: 10px 0px 10px 0px;'><span style='' class='label label-default'>" +
        parts[0] +
        "</span><br><span style='font-size: .7em;' class='label label-default'>" +
        parts[1] +
        '</span>';
    }

    contractSections[item].reference2 = reference;
  }
  contract.sections = contractSections;
  const section = sections.pop();

  if (withBonus && section?.code === 'CELL' && !localBonus) {
    contract.bonus = await getBonos(contract.id);
  } else if (withBonus) {
    contract.bonus = await GfBonusService.getContractBonos(contract.id);
  } else {
    contract.bonus = [];
  }

  contract.labels = await GfFeegroupsLabel.findAll({
    include: [
      {
        model: GfFeegroupsLabelsXref,
        as: 'xrefs',
        required: true,
        where: {
          feeGroupId: contract.feeGroupId,
        },
      },
    ],
  });

  contract.discounts = await GfDiscountsMatrix.findAll({
    include: [
      {
        model: GfFeegroupsGroupLabel,
        as: 'feeGroupLabels',
        required: true,
        include: [
          {
            model: GfFeeGroup,
            as: 'feeGroups',
            where: {
              id: contract.feeGroupId,
            },
            required: true,
          },
        ],
      },
    ],
  });

  if (withDiscounts) {
    const { pending, executed } =
      await GfDiscountsExecuteService.getDiscountsFromContract(contract.id);
    contract.discountsPending = pending;
    contract.discountsExecuted = executed;
  }

  const incidences = await GfIncidence.count({
    where: {
      contractId: contract.id,
      closed: 0,
    },
  });

  contract.openIncidence = incidences > 0;
  contract.alive = await GfContractsUnpaidService.getAlive(contract.id);

  if (contract.invoiceProfileId > 0) {
    contract.invoiceProfile = await InvoiceClientsInvoiceProfile.findByPk(
      contract.invoiceProfileId,
    );
  }

  return contract;
};

/**
 * get history of contract between two date
 **/
export const getContractHistory = async function (
  contract: AnyModel | number | null,
  initDate: Moment | string | null = null,
  endDate: Moment | string | null = null,
) {
  if (typeof contract !== 'object') {
    contract = await GfContract.findByPk(contract);
  }
  assert(contract);

  if (!contract.dateDeactivation && contract.state !== 'active') {
    contract.dateDeactivation = null;
  }

  initDate = initDate ? moment(initDate) : moment(contract.dateActivation);
  endDate = endDate ? moment(endDate) : moment();

  if (
    contract.dateDeactivation &&
    endDate
      .clone()
      .startOf('day')
      .isAfter(moment(contract.dateDeactivation).startOf('day'))
  ) {
    endDate = moment(contract.dateDeactivation);
  }

  if (
    contract.dateActivation &&
    initDate
      .clone()
      .startOf('day')
      .isBefore(moment(contract.dateActivation).startOf('day'))
  ) {
    initDate = moment(contract.dateActivation);
  }

  const initTime = initDate.format(dateFormat);
  const endTime = endDate.format(dateFormat);
  const extraConteractInfo = await GfContract.findByPk(contract.id, {
    include: [
      {
        model: GfContractHolderChange,
        as: 'holders',
        where: {
          state: 'done',
          changeDate: {
            [Op.gte]: initTime,
          },
        },
        order: [['changeDate', 'ASC']],
        required: false,
      },
      {
        model: GfContractFeeChange,
        as: 'change_fees',
        where: {
          done: 1,
          executedDate: {
            [Op.between]: [initTime, endTime],
          },
        },
        order: [['executedDate', 'ASC']],
        required: false,
      },
      {
        model: GfBonusHistory,
        as: 'change_bonus',
        where: {
          initDate: {
            [Op.lte]: endTime,
          },
          [Op.or]: [
            {
              endDate: {
                [Op.eq]: null,
              },
            },
            {
              endDate: {
                [Op.gte]: initTime,
              },
            },
          ],
        },
        required: false,
      },
      {
        model: GfContractUnpaid,
        as: 'blocks',
        where: {
          init: {
            [Op.lt]: endTime,
            [Op.ne]: null,
          },
          [Op.or]: [
            {
              end: {
                [Op.gt]: initTime,
              },
            },
            {
              end: {
                [Op.eq]: null,
              },
            },
          ],
        },
        required: false,
      },
    ],
  });

  return {
    holders: getHolders(extraConteractInfo!, initDate, endDate),
    fees: getFeeChange(extraConteractInfo!, initDate, endDate),
    bonos: getBonusChange(extraConteractInfo!, initDate, endDate),
    blocked: getBlockedHistory(extraConteractInfo!, initDate, endDate),
  };
};

export const getHolders = (
  contract: AnyModel,
  initDate: Moment,
  endDate: Moment,
) => {
  const changes = contract.holders ? contract.holders : [];
  type HolderChange = { init: string; end: string; _id: number };
  const holders: Record<string, Array<HolderChange>> = {};
  function pushToHolders(clientId: number, holderChange: HolderChange) {
    if (holders[clientId]) {
      holders[clientId].push(holderChange);
    } else {
      holders[clientId] = [holderChange];
    }
  }

  if (changes.length === 0) {
    pushToHolders(contract.clientId, {
      init: initDate.format(dateFormat),
      end: endDate.format(dateFormat),
      _id: 0,
    });
    return holders;
  }

  let startDate = initDate;
  let changeId;
  let lastChange;
  for (const change of changes) {
    const changeDate = moment(change.changeDate);

    pushToHolders(change.fromClientId, {
      init: startDate.format(dateFormat),
      end: changeDate.format(dateFormat),
      _id: changeId ?? 0, // 0 means that was initial holder
    });

    changeId = change.id;
    startDate = changeDate;
    lastChange = change;
  }

  pushToHolders(lastChange.toClientId, {
    init: startDate.format(dateFormat),
    end: endDate.format(dateFormat),
    _id: changeId ?? 0,
  });

  return holders;
};

const getFeeChange = (
  contract: AnyModel,
  initDate: Moment,
  endDate: Moment,
) => {
  if (!(initDate.isValid() && endDate.isValid())) return {};
  const changes = contract.change_fees;
  type CHANGE_FEE = {
    init: string;
    end: string;
    _id: number;
  };
  const fees: Record<string, Array<CHANGE_FEE>> = {};
  let startDate = initDate.format(dateFormat);
  let changeId;
  let lastChange;
  for (const change of changes) {
    const feeChange = fees[change.fromFeeGroupId as string] ?? [];
    feeChange.push({
      init: startDate,
      end: moment(change.executedDate).format(dateFormat),
      _id: changeId,
    });
    _.set(fees, change.fromFeeGroupId, feeChange);
    changeId = change.id;
    startDate = moment(change.executedDate).format(dateFormat);
    lastChange = change.get({ plain: true });
  }

  if (changes.length) {
    const key = lastChange.toFeeGroupId;
    const feeChange = fees[key] ?? [];
    feeChange.push({
      init: moment(startDate).format(dateFormat),
      end: endDate.format(dateFormat),
      _id: Number(lastChange.id ?? 0),
    });
    _.set(fees, key, feeChange);
  } else {
    const key = contract.feeGroupId;
    const feeChange = fees[key] ?? [];
    feeChange.push({
      init: initDate.format(dateFormat),
      end: endDate.format(dateFormat),
      _id: Number(lastChange?.id ?? 0),
    });
    _.set(fees, key, feeChange);
  }
  return fees;
};

const getBonusChange = (
  contract: AnyModel,
  initDate: Moment,
  endDate: Moment,
) => {
  if (!initDate.isValid() || !endDate.isValid()) return {};

  const _bonus = contract.change_bonus;
  const bonus: Record<string, any[]> = {};
  for (const bono of _bonus) {
    const bonoInitDate = moment(bono.initDate);
    const bonoEndDate = bono.endDate ? moment(bono.endDate) : null;

    const bonusXref: Array<{ init: string; end: string }> =
      bonus[`${bono.bonoId}.xref-${bono.xrefId}`] ?? [];
    bonusXref.push({
      init: bonoInitDate.isBefore(initDate)
        ? initDate.format(dateFormat)
        : bonoInitDate.format(dateFormat),
      end: bonoEndDate
        ? bonoEndDate.format(dateFormat)
        : endDate.format(dateFormat),
    });
    _.setWith(bonus, `${bono.bonoId}.xref-${bono.xrefId}`, bonusXref, Object);
  }
  return bonus;
};

const getBlockedHistory = (contract: AnyModel, from: Moment, end: Moment) => {
  if (!from.isValid() || !end.isValid()) return [];
  const upPeriods = contract.blocks;
  const blocked = [];
  for (const upPeriod of upPeriods) {
    blocked.push({
      init: moment(upPeriod.init).format(dateFormat),
      end: upPeriod.alive
        ? '2500-01-01 00:00:00'
        : moment(upPeriod.end).format(dateFormat),
      _id: upPeriod.id,
    });
  }
  return blocked;
};

/**
 * update a category record by id
 **/
export const executeIvoz = async function (id: number, user: User) {
  const section = await GfSection.findByCode(SERVICE.FIX);
  assert(section);
  const model = await GfIvozFix.findOne({ where: { contractId: id } });
  await GfContractSectionStatusService.execute(id, section.id, user.userId);
  const ivozFix = await GfIvozFix.findOne({ where: { contractId: id } });

  if (ivozFix) {
    await ActionEvent.forResourceUpdate({
      resource: ivozFix,
      original: model,
      userId: user.id,
    }).markAsFinished();
  }

  return getGfContractsId(id);
};

export const executeOperadors = async function (
  id: number,
  body: Record<string, any>,
  userId: number,
) {
  const section = await GfSection.findByCode(SERVICE.FIX);
  assert(section);
  const model = await GfIvozFix.findOne({ where: { contractId: id } });
  const contract = await GfContract.findByPk(id);
  assert(contract);
  const result = await OperadorFixFacade.execute(id);

  return result.success
    ? respondSuccess(result.data)
    : respondNotFound(result.error);
};
export const getOperadorsStatus = async function (
  id: number,
  body: Record<string, any>,
  userId: number,
) {
  const result = await OperadorFixFacade.getOperadorsStatus(id);
  if (result.success) {
    return respondSuccess(result.data);
  } else {
    return respondNotFound(result.error);
  }
};
export const execute = async (
  contractId: number,
  sectionCode: string,
  userId: number,
) => {
  await GfContractSectionStatusService.execute(
    contractId,
    await getSectionIdByCode(sectionCode),
    userId,
  );

  return getGfContractsId(contractId);
};

/**
 * Your GET endpoint
 **/
export const getRadiusInfo = async function (contractId: number) {
  if (!RadiusApiService.getInstance().isConfigured())
    return respondNotFound('Radius Not Configured');

  const dataInternet = await GfContractDataInternet.findOne({
    where: {
      contractId,
    },
  });

  if (!dataInternet?.nodeRadiusName) {
    return respondNotFound("The 'nodeRadiusName' is empty");
  }

  const radiusInfo = await RadiusApiService.getUserData(
    dataInternet.nodeRadiusName,
  );

  if (!radiusInfo.success) {
    //@ts-ignore
    return respondNotFound(radiusInfo.error ?? radiusInfo.reason);
  }

  const mustHave = await getRadiusGroup(contractId);
  const generalData = _.get(radiusInfo, 'data.data.general', {});
  const connectionData = _.get(radiusInfo, 'data.data.connection.data', {});
  let reason = '';
  let state = 'ok';

  if (!dataInternet.nodeRadiusName && !dataInternet.node) {
    state = 'pending';
    reason = 'Pending to configure';
  }

  if (
    generalData.username !== dataInternet.nodeRadiusName ||
    generalData.password !== dataInternet.nodeRadiusPassword ||
    generalData.speed_up != String(mustHave.up) ||
    generalData.speed_down != String(mustHave.down)
  ) {
    state = 'warning';
    reason = "Users found don't match local data";
  }

  return respondSuccess({
    status: _.get(radiusInfo, 'data.data.connection.status'),
    state,
    mustHave,
    reason,
    ...generalData,
    ...connectionData,
  });
};

/**
 * Configure radius.
 **/
export const doRadius = async function (id: number, user: User) {
  await configureRadius(id, user);

  return getRadiusInfo(id);
};

/**
 * Configure radius.
 **/
export const searchRadius = async function (body: Record<string, any>) {
  const searchString = body.search.replace(/%/g, '');
  assert(
    RadiusApiService.getInstance().isConfigured(),
    'Radius Not Configured',
  );

  const searchRadius = await RadiusApiService.getUserLike(`%${searchString}%`);

  if (!searchRadius.success)
    respondBadRequest(_.get(searchRadius, 'error.meta'));

  const users = _.map(_.get(searchRadius, 'data.data.users'), (radiusInfo) => {
    const generalData = _.get(radiusInfo, 'general', {});
    const connectionData = _.get(radiusInfo, 'connection.data', {});

    return {
      status: _.get(radiusInfo, 'data.data.connection.status'),
      ...generalData,
      ...connectionData,
    };
  });

  return respondSuccess(users, _.get(searchRadius, 'data.meta'));
};

/**
 * Your GET endpoint
 **/
export const getCpeInfo = async function (contractId: number) {
  const dataInternet = await GfContractDataInternet.findOne({
    where: { contractId },
  });

  assert(
    dataInternet?.cpeSn,
    new errors.NotFound(
      `${GfContractDataInternet.name} with id:${contractId} not found`,
    ),
  );

  const device = await ACS.devices.findBySerialNumber(dataInternet.cpeSn);

  return respondSuccess(device.cpeInfo());
};

/**
 * Your GET endpoint
 **/
export const doCpeAction = async function (
  contractId: number,
  actionName: ACTION,
) {
  const dataInternet = await GfContractDataInternet.findOne({
    where: { contractId },
  });

  assert(
    dataInternet,
    `${GfContractDataInternet.name} with id:${contractId} not found`,
  );

  // make sure local cpe data is already fetched from remote and is synched
  await GfContractDataInternetService.updateCpeInfoFromRemote(dataInternet);
  assert(dataInternet.cpeDeviceId, 'Cpe not configured yet!');

  await ACS.devices.performAction(dataInternet.cpeDeviceId, actionName);

  return getCpeInfo(contractId);
};

export const pingCpe = async function (id: number) {
  const dataInternet = await GfContractDataInternet.findOne({
    where: {
      contractId: id,
    },
  });

  assert(
    dataInternet,
    `${GfContractDataInternet.name} with id:${id} not found`,
  );

  assert(dataInternet.cpeSn, 'cpeSn not configured.');

  await ACS.devices.ping(dataInternet.cpeSn);

  return getCpeInfo(id);
};

/**
 * Create docs when a contract is created or updated.
 */
export const ensureOfDocument = async function (contract: AnyModel) {
  const status = await GfContractSectionStatusService.findForContract(
    contract.id,
  );

  const service = getServiceForSectionType(status.type);

  if (status.type === SERVICE.CELL) {
    await service.ensureOfDocument(status.section.row, status);
  } else {
    await service.ensureOfDocument(contract, status);
  }
};

export const ensureOfDocumentByContractId = async function (
  contractId: number,
) {
  const contract = await GfContract.findByPk(contractId);
  assert(contract, `${GfContract.name} with id:${contractId} not found`);
  return ensureOfDocument(contract);
};

export const getFullContract = async function (contractId: number) {
  const contract = await GfContract.findByPk(contractId);
  assert(contract, `${GfContract.name} with id:${contractId} not found`);
  const hydratedContract = await hydrateContract(
    contract,
    true,
    true,
    true,
    true,
    true,
  );
  const section = hydratedContract.sections[0];
  const sectionCode = section.code;

  if (sectionCode === 'INTERNET') {
    // use internet address
    hydratedContract.installationAddress = GeoGoufoneService.getFormatedAddress(
      section,
      true,
    );
  } else if (sectionCode === 'FIX') {
    // user internet related address
    const dataInternet = await GfContractDataInternet.findOne({
      where: {
        contractId: section.internetSectionId,
      },
    });
    hydratedContract.installationAddress = dataInternet
      ? GeoGoufoneService.getFormatedAddress(dataInternet, true)
      : hydratedContract.installationAddress;
  } else {
    const client = await GfClient.findByPk(hydratedContract.clientId);

    hydratedContract.installationAddress = GeoGoufoneService.getFormatedAddress(
      client!,
      true,
    );
  }

  return hydratedContract;
};

export const onAfterInsert = async (
  contract: AnyModel,
  userId: number,
  createSectionRow = false,
) => {
  if (createSectionRow) {
    await ensureHasSection(contract, userId);
    await ensureOfDocument(contract);
  }
};

export const onAfterUpdate = async (contract: AnyModel, userId: number) => {
  if (contract.changed('collaboratorId'))
    await GfClientContractCollaboratorHistory.create({
      type: 'contract',
      typeId: contract.id,
      fromCollaboratorId: contract.collaboratorId,
      changeDoneBy: userId,
      changeDate: moment().format('YYYY-MM-DD HH:mm:ss'),
    });

  if (contract.changed('dateActivation'))
    await updateDiscountsExecuted(
      contract.id,
      contract.dateActivation,
      contract.previous('dateActivation'),
    );

  await ensureOfDocument(contract);
};

//

/**
 * search contracts that cellProviderId of fees is aire code
 */
export const getActiveAireCells = async (): Promise<
  Array<{
    id: number;
    clientId: number;
    feeGroupId: number;
  }>
> => {
  const uid = config.get('intranet.uid', 90);
  const aireProvider = await GfCellProvider.findOne({
    where: { code: 'aire' },
    attributes: ['id'],
  });

  const aireProviderId = aireProvider?.id ?? 0;

  const result = await knex('gf_contracts')
    .select(
      'gf_contracts.*',
      'gf_contract_data_cell.number',
      knex('gf_fees')
        .select('gf_fees.cellProviderId')
        .where({
          'gf_fees.feeGroupId': knex.ref('gf_contracts.feeGroupId'),
          'gf_fees.uid': 90,
          'gf_fees.status': 1,
        })
        .orderBy('gf_fees.id', 'desc')
        .limit(1)
        .as('aireProviderId'),
    )
    .innerJoin(
      'gf_contract_data_cell',
      'gf_contract_data_cell.contractId',
      'gf_contracts.id',
    )
    .where({
      'gf_contracts.uid': uid,
      'gf_contracts.status': 1,
      'gf_contract_data_cell.uid': uid,
      'gf_contract_data_cell.status': 1,
    })
    .whereIn('gf_contracts.state', ['active', 'blocked'])
    .having('aireProviderId', '=', aireProviderId)
    .orHavingRaw('aireProviderId is NULL');

  return result;
};

export const getCachedContractSection = async function (
  contractId: number,
): Promise<{ type: string; section: { row: AnyModel; status: AnyModel } }> {
  const sections = (await cachedContractSections())[contractId];
  const type = Object.keys(sections)[0] as SERVICE;

  return {
    type,
    section: sections[type]!,
  };
};

export const cachedContractSections = async () => {
  return Static.sear(
    'GfContractService.cachedContractSections',
    async () => {
      const sections = await GfContractSectionStatus.findAll({
        include: [
          {
            model: GfSection,
            as: 'section',
            required: true,
            attributes: ['id', 'code'],
          },
        ],
      });

      const dataContracts: Record<SERVICE, AnyModel[]> = {
        INTERNET: await GfContractDataInternet.findAll(),
        FIX: await GfContractDataFix.findAll(),
        CELL: await GfContractDataCell.findAll(),
        TV: await GfContractDataTv.findAll(),
      };

      const result: Record<
        number,
        Partial<Record<SERVICE, { row: AnyModel; status: AnyModel }>>
      > = {};

      sections.forEach((status) => {
        const sectionCode = status.section.code as SERVICE;
        const contractId = status.contractId;

        if (!result[contractId]) {
          result[contractId] = {};
        }

        result[contractId][sectionCode] = {
          status,
          row: dataContracts[sectionCode].find(
            (dataContract) => dataContract.contractId == contractId,
          ) as AnyModel,
        };
      });

      return result;
    },
    1200,
  );
};

export const getContractSection = async function (contractId: number) {
  const sections = await getContractSections(contractId);
  const type = Object.keys(sections)[0] as SERVICE;

  return { type, section: sections[type] };
};

const getContractSections = async (contractId: number) => {
  const sections = await GfContractSectionStatus.findAll({
    where: { contractId },
    include: [
      {
        model: GfSection,
        as: 'section',
        required: true,
        attributes: ['id', 'code'],
      },
    ],
  });

  const result: Partial<Record<SERVICE, { row: AnyModel; status: AnyModel }>> =
    {};
  for (const status of sections) {
    const Model = getModelForSectionType(status.section.code);
    assert(Model, `Model not found for section [${status.section.code}]`);

    const row = await Model.findOne({ where: { contractId } });

    result[status.section.code as SERVICE] = { row, status };
  }

  return result;
};

export const aireBonuses = async (contractId: number) => {
  const contract = await GfContract.findByPk(contractId);
  assert(contract);

  const actualConditions = await GfFeeService.getActualConditions(
    contract.feeGroupId,
  );
  const provider = await GfCellProviderFee.findByPk(actualConditions.cellFee);
  assert(provider);

  const bonos = await AireAdditionalBono.findAllAndIgnoreIncompatibleError({
    tarifa: provider.providerFeeId,
    tarifa_basica: 'N',
  });

  return respondSuccess(bonos);
};

export const exportGfContracts = async (req: Request, res: Response) => {
  const contracts: Record<string, string>[] = [];
  const limit = 500;
  let hasMore = true;
  let offset = 0;
  const implode = (array: string[], joint = ' | ') => {
    return array.filter((item) => item).join(joint);
  };

  while (hasMore) {
    const { rows }: { rows: AnyModel[] } = await findAllEntities(
      {
        ...req.query,
        include: -1,
        offset: offset,
        limit,
      },
      GfContract,
      undefined,
      [
        {
          model: GfFeeGroup,
          as: 'fee_group',
          attributes: ['name'],
          include: [
            {
              model: GfSection,
              as: 'sections',
              required: false,
              attributes: ['code'],
            },
          ],
          required: false,
        },
        {
          model: GfContractDataCell,
          as: 'dataCell',
          required: false,
          attributes: ['number'],
        },
        {
          model: GfContractDataFix,
          as: 'dataFix',
          required: false,
          attributes: ['number'],
        },
        {
          model: GfContractDataInternet,
          as: 'dataInternet',
          required: false,
          attributes: ['ip', 'nodeRadiusName', 'cpeSn', 'providerCode'],
        },
        {
          model: GfClient,
          as: 'client',
          required: false,
          attributes: ['id', 'name', 'fiscalId'],
        },
        {
          model: ContractTag,
          as: 'tags',
          required: false,
        },
      ],
    );

    rows.forEach((row) => {
      contracts.push({
        Status: String(row.state),
        'Date Activation': row.dateActivation,
        'Date Deactivation': row.dateDeactivation,
        Customer: implode([row.client?.name, row.client?.fiscalId]),
        'Phone / IP / Inforepair / SN': implode([
          row.dataCell?.number,
          row.dataFix?.number,
          row.dataInternet?.ip,
          row.dataInternet?.cpeSn,
        ]),
        'Fee / Supplier / Provider Code / Alias / Reference': implode([
          row.fee_group?.name,
          row.dataInternet?.providerCode,
          row.alias,
          row.reference,
        ]),
        Type: row.type,
        'Marketing Tags': implode(
          (row.tags ?? []).map(({ name }) => name.en ?? Object.values(name)[0]),
        ),
      });
    });

    hasMore = rows.length === limit;
    offset += limit;
  }

  const parser = new Parser({
    fields: [
      'Status',
      'Type',
      'Date Activation',
      'Date Deactivation',
      'Customer',
      'Phone / IP / Inforepair / SN',
      'Fee / Supplier / Provider Code / Alias / Reference',
      'Marketing Tags',
    ],
  });
  const csv = parser.parse(contracts);

  writeFile(res, {
    filename: moment().toLocaleString() + '.csv',
    type: 'attachment',
    buffer: csv,
  });
};

export const importAireLine = async (contractId: number, userId: number) => {
  return importContract(contractId, userId);
};

export const importContract = async (contractId: number, userId: number) => {
  const [cellProvider, dataCell] = await Promise.all([
    provider(contractId),
    GfContractDataCell.findByContractId(contractId),
  ]);
  assert(dataCell?.number, 'Missing cell number!');
  assert(cellProvider, 'Missing cell provider!');

  if (cellProvider === CELL_PROVIDER_CODE.AIRE) {
    await revisionAireLine(dataCell.number, userId);
  } else {
    await revisionLemonLine(dataCell.number, userId);
  }

  return getGfContractsId(contractId);
};

export const getCdrs = async (id: number, query: Record<string, any>) => {
  const contract = await GfContract.findByPk(id, {
    include: [
      {
        model: GfContractDataCell,
        as: 'dataCell',
        required: false,
      },
      {
        model: GfContractDataFix,
        as: 'dataFix',
        required: false,
      },
      {
        model: GfFeeGroup,
        as: 'fee_group',
        include: [
          {
            model: GfSection,
            as: 'sections',
            required: false,
          },
        ],
        required: false,
      },
    ],
  });
  assert(contract, `Contract not found for id ${id}`);

  const cdrModels: Partial<Record<SERVICE, typeof AnyModel>> = {
    [SERVICE.CELL]: GfAireCdr2,
    [SERVICE.FIX]: GfKamailioUnifiedCdr,
  };

  const cdrModel = cdrModels[contract.type as SERVICE];

  assert(cdrModel, `Cdr not found for type '${contract.type}'`);

  const cdrs = await getAllEntities(
    {
      ...query,
      number:
        contract.type === SERVICE.CELL
          ? contract.dataCell?.number
          : contract.dataFix?.number,
    },
    cdrModel,
    contract.type === SERVICE.CELL
      ? {
          [Op.or]: {
            origen: contract.dataCell.number,
            destino: contract.dataCell.number,
          },
        }
      : { contractId: contract.id },
  );

  cdrs.payload.data = cdrs.payload.data.map((cdr: AnyModel) =>
    cdr.toCdrResponse(contract),
  );

  return cdrs;
};

export const getCdrReports = async (id: number, query: Record<string, any>) => {
  const contract = await GfContract.findByPk(id, {
    include: [
      {
        model: GfContractDataCell,
        as: 'dataCell',
        required: false,
      },
      {
        model: GfContractDataFix,
        as: 'dataFix',
        required: false,
      },
      {
        model: GfFeeGroup,
        as: 'fee_group',
        include: [
          {
            model: GfSection,
            as: 'sections',
            required: false,
          },
        ],
        required: false,
      },
    ],
  });
  assert(contract, `Contract not found for id ${id}`);

  const cdrModels: Partial<Record<SERVICE, typeof AnyModel>> = {
    [SERVICE.CELL]: GfAireCdr2,
    [SERVICE.FIX]: GfKamailioUnifiedCdr,
  };

  const cdrModel = cdrModels[contract.type as SERVICE];

  assert(cdrModel, `Cdr not found for type '${contract.type}'`);

  const result = await getAllEntities(
    {
      ...query,
      size: Date.now(),
      number:
        contract.type === SERVICE.CELL
          ? contract.dataCell?.number
          : contract.dataFix?.number,
    },
    cdrModel,
    contract.type === SERVICE.CELL
      ? {
          [Op.or]: {
            origen: contract.dataCell.number,
            destino: contract.dataCell.number,
          },
        }
      : { contractId: contract.id },
  );

  const cdrs = result.unwrap();
  let seconds = 0;
  let data = 0;
  let charges = 0;
  let calls = 0;

  cdrs.forEach((cdr: AnyModel) => {
    const attributes = cdr.toCdrResponse(contract);

    if ([CDR_STATES.INCOME, CDR_STATES.OUTCOME].includes(attributes.type)) {
      seconds += Number(attributes.amount);
      calls += 1;
    } else if (attributes.type === CDR_STATES.DATOS) {
      data += Number(attributes.amount);
    }

    charges += parseFloat(cdr.userCharge ?? 0);
  });

  return {
    duration: formatTime(seconds),
    data: formatFileSize(data),
    charges: parseFloat(Number(charges).toFixed(2)),
    calls,
  };
};

export const destroyIvoz = async (contractId: number, user: User) => {
  await destroyIvozConnection(contractId, user);

  return getGfContractsId(contractId);
};

/**
 * in this function, we will compare the router username/password stored in
 *  - radius
 *  - asc
 */
export const needsFactoryReset = async (contractId: number) => {
  const dataInternet = await GfContractDataInternet.findOne({
    where: { contractId },
  });

  if (!dataInternet) {
    throw new errors.NotFound(
      `GfContractDataInternet with id ${contractId} not found`,
    );
  }

  const { nodeRadiusName } = dataInternet;

  if (!nodeRadiusName) return false;
  const radiusData = await RadiusApiService.getUserData(nodeRadiusName);
  assert(radiusData.success);
  const { username, password } = radiusData.data.data.general;

  const [error, device] = await to(
    ACS.devices.findBySerialNumber(dataInternet.cpeSn!),
  );
  if (error) {
    console.log(
      `[needsFactoryReset][contractId:${contractId}]`,
      'cpe device not found',
    );
    return false;
  }

  const connection = device.connection();

  if (!connection.username || !connection.password) return false;

  return username !== connection.username || password !== connection.password;
};

interface ContractsToBeSuspended {
  id: number;
  suspendDate: string;
}

const getBlockedContractsToBeSuspended = async () => {
  const last_unpaid_id_only = knex('intranet.unpaid_invoices')
    .select(
      knex.raw(
        'MAX(unpaid_invoices.id) as id, unpaid_invoices.client_id as clientId',
      ),
    )
    .where('unpaid_invoices.status', 1)
    .groupBy('unpaid_invoices.client_id')
    .as('last_unpaid_id_only');

  const query = knex('gf_contracts')
    .select(
      'gf_contracts.id',
      knex.raw(
        'DATE_ADD(unpaid_invoices.cut_date, INTERVAL 90 DAY) as suspendDate',
      ),
    )
    .leftJoin(
      last_unpaid_id_only,
      'last_unpaid_id_only.clientId',
      'gf_contracts.clientId',
    )
    .leftJoin(
      'intranet.unpaid_invoices',
      'unpaid_invoices.id',
      'last_unpaid_id_only.id',
    )
    .innerJoin('gf_clients', 'gf_clients.id', 'gf_contracts.clientId')
    .where('gf_clients.status', 1)
    .where('gf_contracts.status', 1)
    .where('unpaid_invoices.invoice_status', 'cutted')
    .where('gf_contracts.state', 'blocked')
    .havingRaw('suspendDate < Now()');

  console.log(query.toSQL().toNative());

  const result: ContractsToBeSuspended[] = await query;

  if (result.length === 0) {
    return [];
  }

  const contracts = await GfContract.findAll({
    where: {
      id: result.map((contract) => contract.id),
    },
  });

  return contracts;
};

/**
 * this function will suspend all the unpaid customer contracts, which are unpaid for
 * more than 90 days
 * only suspends contracts with status 'blocked'
 */
export const suspendUnpaidCustomers = async () => {
  const contracts = await getBlockedContractsToBeSuspended();
  if (contracts.length === 0) return;
  console.log(
    '[GfContractService]',
    `${contracts.length} contracts will be suspended`,
    contracts.map((contract) => contract.id),
  );
  const result = await SuspendContracts(contracts, 0);

  const failures = result.filter(
    (settled) => settled.status === 'rejected',
  ) as PromiseRejectedResult[];

  if (failures.length > 0) {
    console.error(
      '[GfContractService]',
      `${failures.length} contracts failed to suspend`,
    );
    for (const failure of failures) {
      console.error(failure.reason);
    }
  }
};

export const getContractsWithInvalidInternetSection = async function (
  query: Record<string, any>,
) {
  delete query.include;

  const fixWithWrongInternet = await knex('intranet.gf_contracts as gc')
    .join('intranet.gf_contract_data_fix as gcdf', 'gcdf.contractId', 'gc.id')
    .join('intranet.gf_contracts as gc2', 'gc2.id', 'gcdf.internetSectionId')
    .where('gc.clientId', '<>', knex.raw('gc2.clientId'))
    .select('gc.id');

  const tvWithWrongInternet = await knex('intranet.gf_contracts as gc')
    .join('intranet.gf_contract_data_tv as gcdt', 'gcdt.contractId', 'gc.id')
    .join('intranet.gf_contracts as gc2', 'gc2.id', 'gcdt.internetContractId')
    .where('gc.clientId', '<>', knex.raw('gc2.clientId'))
    .select('gc.id');

  console.log(
    fixWithWrongInternet.concat(tvWithWrongInternet).map(({ id }) => id),
  );

  return getAllEntities(
    query,
    GfContract,
    {
      state: CONTRACT.ACTIVE,
      id: fixWithWrongInternet.concat(tvWithWrongInternet).map(({ id }) => id),
    },
    [
      {
        model: GfFeeGroup,
        as: 'fee_group',
        include: [
          {
            model: GfSection,
            as: 'sections',
            required: false,
          },
        ],
        required: false,
      },
      {
        model: GfContractDataTv,
        as: 'dataTv',
        required: false,
        include: [
          {
            model: GfContract,
            as: 'internetContract',
            required: false,
            include: [
              {
                model: GfClient,
                as: 'client',
                required: false,
              },
            ],
          },
        ],
      },
      {
        model: GfContractDataFix,
        as: 'dataFix',
        required: false,
        include: [
          {
            model: GfContract,
            as: 'internetSection',
            required: false,
            include: [
              {
                model: GfClient,
                as: 'client',
                required: false,
              },
            ],
          },
        ],
      },
      {
        model: GfContractSectionStatus,
        as: 'statuses',
        required: false,
      },
      {
        model: GfClient,
        as: 'client',
        required: false,
      },
    ],
  );
};

const mapContract = (contract: AnyModel) => {
  return {
    client: {
      id: contract.client.id,
      uid: contract.client.uid,
      fiscalId: contract.client.fiscalId,
      name: contract.client.name,
      active: contract.client.isActive(),
      contactPhone: [String(contract.client.contactPhone)],
    },
    contract: {
      id: contract.id,
      clientId: contract.clientId,
      userId: contract.userId,
      state: contract.state,
      status: Boolean(contract.status),
      sellerId: contract.sellerId,
      installer: contract.dataInternet.installatorUser
        ? {
            ...contract.dataInternet.installatorUser.get({ plain: true }),
            user: contract.dataInternet.installatorUser.email,
            admin: null,
            language: 'es',
          }
        : {},
    },
    dataInternet: {
      id: contract.dataInternet.id,
      cpeDsn: contract.dataInternet.cpeDsn,
      cpeSn: contract.dataInternet.cpeSn,
      cpeModel: contract.dataInternet.cpeModel,
      cpeVoipProfile: contract.dataInternet.cpeVoipProfile,
      nodeRadiusName: contract.dataInternet.nodeRadiusName,
      nodeRadiusPassword: contract.dataInternet.nodeRadiusPassword,
      cpePppoeUsername: contract.dataInternet.cpePppoeUsername,
      cpePppoePassword: contract.dataInternet.cpePppoePassword,
      cpeWifiSsid: contract.dataInternet.cpeWifiSsid,
      cpeWifiPassword: contract.dataInternet.cpeWifiPassword,
      cpeId: contract.dataInternet.cpeId,
      cpeLineProfile: contract.dataInternet.cpeLineProfile,
      config_wifi_on_reconfig: contract.dataInternet.config_wifi_on_reconfig,
    },
  };
};
export const getGfContractBySerialNumber = async (serialNumber: string) => {
  const include = [
    {
      model: GfContractDataInternet,
      as: 'dataInternet',
      where: { cpeSn: serialNumber },
      include: {
        model: GfUser,
        as: 'installatorUser',
        attributes: ['id', 'email', 'name', 'uid', 'status'],
        required: false,
      },
    },
    {
      model: GfClient,
      as: 'client',
    },
  ];
  const contract = await GfContract.findOne({ include });
  const dataFixes = await GfContractDataFix.findAll({
    include: [
      {
        model: GfContract,
        as: 'contract',
        include,
      },
      {
        model: GfIvozFix,
      },
    ],
  });

  assert(
    contract,
    new errors.NotFound(`Contract for cpe ${serialNumber} not found`),
  );

  return respondSuccess({
    ...mapContract(contract),
    fixContracts: dataFixes.map((dataFix) => {
      return {
        ...mapContract(dataFix.contract),
        ivoz: {
          id: dataFix.GfIvozFix.id,
          uid: dataFix.GfIvozFix.uid,
          contractId: dataFix.GfIvozFix.contractId,
          extension: dataFix.GfIvozFix.extension,
          password: dataFix.GfIvozFix.password,
          email: dataFix.GfIvozFix.email,
          useAta: dataFix.GfIvozFix.useAta,
        },
        fix: {
          id: dataFix.id,
          uid: dataFix.uid,
          contractId: dataFix.contractId,
          internetSectionId: dataFix.internetSectionId,
          number: dataFix.number,
          extension: dataFix.extension,
          creationDate: dataFix.creationDate,
          updateDate: dataFix.updateDate,
        },
      };
    }),
  });
};

export const reactivate = async (contractId: number, user: User) => {
  const contract = await GfContract.findByPk(contractId);
  assert(contract, new errors.NotFound());
  assert(
    contract.isFrozen() && contract.isSuspended(),
    new errors.BadRequest('Contract is not frozen!'),
  );

  const { success } = await restoreContract(contractId);
  assert(success, 'Failure to reactivate the service!');
  await contract.update({
    frozen: false,
    state: CONTRACT.ACTIVE,
    dateActivation: moment().toDate(),
    dateDeactivation: null,
  });

  await ActionEvent.forAction({
    resource: contract,
    userId: user.id,
    action: 'Reactivation',
  }).markAsFinished();

  return respondSuccess('ok');
};

export const getGfContractDataFixInternets = async (
  clientId: string,
  query = {},
) => {
  const [subscriptions, internets] = await Promise.all([
    GfFeeGroup.findAll({
      raw: true,
      attributes: ['id'],
      include: [
        {
          model: GfSection,
          as: 'sections',
          required: true,
          attributes: ['id'],
          where: { code: [SERVICE.SUBSCRIPTION] },
        },
        {
          model: GfFee,
          as: 'gf_fees',
          required: true,
          attributes: [],
          where: { applicableService: [SERVICE.FIX] },
        },
      ],
    }),
    GfFeeGroup.findAll({
      raw: true,
      attributes: ['id'],
      include: [
        {
          model: GfSection,
          as: 'sections',
          required: true,
          attributes: ['id'],
          where: { code: [SERVICE.INTERNET] },
        },
      ],
    }),
  ]);

  const validFeeGRoups = pluck(internets, 'id')
    .concat(pluck(subscriptions, 'id'))
    .flat();

  return getAllEntities(
    query,
    GfContract,
    { clientId, state: { [Op.not]: CONTRACT.SUSPENDED } },
    [
      {
        model: GfFeeGroup,
        as: 'fee_group',
        required: true,
        attributes: ['id', 'name', 'internalName', 'type'],
        where: { id: validFeeGRoups },
        include: [
          {
            model: GfSection,
            as: 'sections',
            required: true,
            attributes: ['id', 'name', 'code'],
          },
        ],
      },
    ],
    {
      attributes: ['id', 'reference', 'state', 'type'],
    },
  );
};

export const saveCpeSnByContractId = async (
  id: number,
  cpeSn: string,
  user: User,
) => {
  const contract = await GfContract.findByPk(id, {
    include: [
      {
        model: GfContractDataInternet,
        as: 'dataInternet',
      },
    ],
  });
  if (!contract) {
    throw new errors.NotFound(`Contract with id ${id} not found`);
  }
  const dataInternet = contract.dataInternet;
  (
    await putGfContractDataInternetsId(
      dataInternet.id,
      {
        cpeSn,
      },
      user,
    )
  ).unwrap();

  await updateFromContract(contract.id, {
    skipCoa: true,
  });
};
