import { AnyModel, intranet } from '@api/models';
import {
  SECTION_STATUS,
  SECTION_STATUS_PENDINGS,
} from '@api/constants/statuses';
import { camelCase, get, groupBy, pickBy } from 'lodash';

import { DocStatus } from '@api/models/intranet/intranet_docs_status';
import { GfContractDataCell } from '@api/models/intranet/intranet_gf_contract_data_cell';
import { GfContractDataFix } from '@api/models/intranet/intranet_gf_contract_data_fix';
import { GfContractDataInternet } from '@api/models/intranet/intranet_gf_contract_data_internet';
import { GfContractDataSubscription } from '@api/models/intranet/intranet_gf_contract_data_subscription';
import { GfContractDataTv } from '@api/models/intranet/intranet_gf_contract_data_tv';
import { GfDoc } from '@api/models/intranet/intranet_gf_docs';
import { GfSection } from '@api/models/intranet/intranet_gf_sections';
import { SERVICE } from '@api/constants/contracts';
import { Static } from '@lib/cache';
import assert from 'assert';
import { documentTypes } from '../documents/GfDocumentService';
import { getFacadeBySectionId } from './GfSectionService';
import { isContractBlocked } from '../unpaid/UnpaidContractService';
import { sectionStateChanged } from './GfCrmContractService';
import { throwIf } from '@api/utils/helpers';
import to from 'await-to-js';
import { updateState } from './GfContractService';

const { GfContract, GfContractSectionStatus } = intranet;

const CACHE_TIME = 1800;
export type ServiceRecord = Partial<
  Record<
    SERVICE,
    {
      row: AnyModel;
      status: AnyModel;
    }
  >
>;

/**
 * Get all section statuses for a given contract ID.
 */
export const getAllForContract = async (contractId: number) => {
  const items = await GfContractSectionStatus.findAll({
    where: {
      contractId: contractId,
    },
    include: [
      {
        model: GfSection,
        as: 'section',
        required: false,
      },
      {
        model: GfContract,
        as: 'contract',
        required: false,
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
            model: GfContractDataInternet,
            as: 'dataInternet',
            required: false,
          },
          {
            model: GfContractDataTv,
            as: 'dataTv',
            required: false,
          },
          {
            model: GfContractDataSubscription,
            as: 'dataSubscription',
            required: false,
          },
        ],
      },
    ],
  });

  const statuses: ServiceRecord = {};

  for (const item of items) {
    if (item.section === null) return;
    const sectionCode: SERVICE = item.section.code;

    statuses[sectionCode] = {
      row: get(item.contract, camelCase('data' + sectionCode)),
      status: item,
    };
  }

  return statuses;
};

/**
 * Get all sectoin status for given contract id
 **/
export const findForContract = async (contractId: number) => {
  const sections = await getAllForContract(contractId);
  const type = (Object.keys(sections!) as SERVICE[])[0];

  return {
    type: type,
    section: sections![type]!,
  };
};

export const setState = async (
  contractId: number,
  sectionId: number,
  state: SECTION_STATUS,
  error: string | null = null,
  pendingState: string | null = null,
  userId: number,
) => {
  checkState(state);

  const isBlocked = await isContractBlocked(contractId);

  // creates new state if not exists
  const [status, { created, stateChanged, pendingStateChanged }]: [
    AnyModel,
    {
      created: boolean;
      stateChanged: boolean;
      pendingStateChanged: boolean;
    },
  ] =
    // @ts-ignore
    await GfContractSectionStatus.updateStatusOrCreate(
      contractId,
      sectionId,
      state,
      isBlocked,
      error,
      pendingState,
    );

  await updateState(contractId, userId);

  if (created || stateChanged || pendingStateChanged) {
    await sectionStateChanged(contractId, sectionId, pendingState, userId);
  }
};

export const setEmptyState = async function (
  contractId: number,
  sectionId: number,
  userId: number,
) {
  return setState(
    contractId,
    sectionId,
    SECTION_STATUS.EMPTY,
    null,
    null,
    userId,
  );
};

export const setPendingState = async (
  contractId: number,
  sectionId: number,
  userId: number,
) => {
  return setState(
    contractId,
    sectionId,
    SECTION_STATUS.PENDING,
    null,
    null,
    userId,
  );
};

export const setDoneState = async (
  contractId: number,
  sectionId: number,
  userId: number,
) => {
  return setState(
    contractId,
    sectionId,
    SECTION_STATUS.DONE,
    null,
    null,
    userId,
  );
};

export const setBlockedState = async (
  contractId: number,
  sectionId: number,
  userId: number,
) => {
  return setState(
    contractId,
    sectionId,
    SECTION_STATUS.BLOCKED,
    null,
    null,
    userId,
  );
};

export const setSuspendedState = async (
  contractId: number,
  sectionId: number,
  userId: number,
) => {
  return setState(
    contractId,
    sectionId,
    SECTION_STATUS.SUSPENDED,
    null,
    null,
    userId,
  );
};

export const setErrorState = async (
  contractId: number,
  sectionId: number,
  reason: string | null = null,
  userId: number,
) => {
  return setState(
    contractId,
    sectionId,
    SECTION_STATUS.ERROR,
    reason,
    null,
    userId,
  );
};

/**
 * Validate state
 *
 * @throws
 **/
export const checkState = (state: string) => {
  throwIf(
    !(Object.values(SECTION_STATUS) as string[]).includes(state),
    `Incorrect state "${state}" GfContractSectionStatus::setState`,
  );
};

export const getState = async (
  contractId: number,
  sectionId?: number,
): Promise<{
  state: SECTION_STATUS;
  pendingState: SECTION_STATUS_PENDINGS;
}> => {
  const status = await GfContractSectionStatus.findOne({
    where: pickBy({ contractId, sectionId }, (value) => value),
  });

  return {
    state: status?.state ?? SECTION_STATUS.EMPTY,
    pendingState: status?.pendingState,
  };
};

export type ExecutionResult = {
  success: boolean;
  reason?: string | null;
  state?: string | null;
  pending?: boolean;
  pendingState?: SECTION_STATUS_PENDINGS | null;
  w8forprovider?: boolean;
};

const needToSignDocuments = async (contractId: number) => {
  const unsigned = await DocStatus.findOne({
    attributes: ['id'],
    where: { signed: 0, type: Object.values(documentTypes.FIX) },
    include: { model: GfDoc, where: { contractId }, attributes: ['id'] },
  });

  return unsigned !== null;
};

export const execute = async (
  contractId: number,
  sectionId: number,
  userId: number,
): Promise<ExecutionResult> => {
  // first check document signed or not
  if (await needToSignDocuments(contractId)) {
    await setState(
      contractId,
      sectionId,
      SECTION_STATUS.PENDING,
      null,
      SECTION_STATUS_PENDINGS.SIGNING,
      userId,
    );

    return {
      success: true,
      pending: true,
      pendingState: SECTION_STATUS_PENDINGS.SIGNING,
    };
  }
  // then try to execute
  const facade = await getFacadeBySectionId(sectionId);
  const [error, result] = await to(facade.execute(contractId, userId));

  if (error) {
    console.log(error);
    await setState(
      contractId,
      sectionId,
      SECTION_STATUS.ERROR,
      error.message,
      null,
      userId,
    );
  } else {
    await setState(
      contractId,
      sectionId,
      result.state,
      null,
      result.pendingState,
      userId,
    );
  }

  return error
    ? { success: false, reason: error.message, state: SECTION_STATUS.ERROR }
    : { success: true, pending: !!result.pendingState, ...result };
};

export const getReference = (
  sectionData: AnyModel,
  sectionCode: string,
  plus = false,
) => {
  assert(
    sectionData,
    '[GfContractSectionStatusService][getReference] missing section data',
  );
  if ([SERVICE.TV, SERVICE.SUBSCRIPTION].includes(sectionCode as SERVICE)) {
    return sectionCode.toLowerCase();
  }

  if ([SERVICE.CELL, SERVICE.FIX].includes(sectionCode as SERVICE)) {
    return sectionData.number;
  }

  if (SERVICE.INTERNET !== sectionCode) {
    return '';
  }

  return plus
    ? `${sectionData.ip}|${sectionData.addressStreet}, ${sectionData.addressCity}`
    : sectionData.ip;
};

export const getAllCached = async (
  force = false,
): Promise<Record<number | string, ServiceRecord>> => {
  return Static.sear(
    'getAllCachedStatuses',
    async () => {
      const items = await GfContractSectionStatus.findAll({
        include: [
          {
            model: GfSection,
            as: 'section',
            required: false,
          },
          {
            model: GfContract,
            as: 'contract',
            required: false,
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
                model: GfContractDataInternet,
                as: 'dataInternet',
                required: false,
              },
              {
                model: GfContractDataTv,
                as: 'dataTv',
                required: false,
              },
              {
                model: GfContractDataSubscription,
                as: 'dataSubscription',
                required: false,
              },
            ],
          },
        ],
      });

      const mapItems: Record<number | string, ServiceRecord> = {};

      Object.values(groupBy(items, 'contractId')).forEach((items) => {
        const statuses: ServiceRecord = {};

        for (const item of items) {
          if (item.section === null) return;

          const sectionCode: SERVICE = item.section.code;

          statuses[sectionCode] = {
            row: get(item.contract, camelCase('data' + sectionCode)),
            status: item,
          };
        }

        mapItems[items[0].contractId] = statuses;
      });

      return mapItems;
    },
    CACHE_TIME,
    force,
  );
};
