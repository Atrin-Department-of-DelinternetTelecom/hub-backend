import { AnyModel, intranet } from '@api/models';
import { DATA_SECTION, SERVICE } from '@api/constants/contracts';

import { GfContractDataCell } from '@api/models/intranet/intranet_gf_contract_data_cell';
import { GfContractDataFix } from '@api/models/intranet/intranet_gf_contract_data_fix';
import { GfContractDataInternet } from '@api/models/intranet/intranet_gf_contract_data_internet';
import { GfContractDataSubscription } from '@api/models/intranet/intranet_gf_contract_data_subscription';
import { GfContractDataTv } from '@api/models/intranet/intranet_gf_contract_data_tv';
import { GfSection } from '@api/models/intranet/intranet_gf_sections';
import { Static } from '@lib/cache';
import assert from 'assert';

const { GfContract, GfContractSectionStatus } = intranet;

export type ServiceRecord<R = AnyModel> = {
  status: AnyModel;
  contract: AnyModel;
  row?: R;
  type: SERVICE;
};

const enum CACHE_KEYS {
  ALL = 'GfContractSectionStatusCaches',
}

export const setupCache = async (contracts: number[] = []) => {
  await Static.remember(
    CACHE_KEYS.ALL,
    async () => possibleRecords(contracts),
    1200,
  );
};

export const forget = async () => {
  await Static.forget(CACHE_KEYS.ALL);
};

/**
 * Get section for the given contract id.
 **/
export const findForContract = async <R extends AnyModel>(
  contractId: number,
): Promise<ServiceRecord | undefined> => {
  const caches: Record<string | number, ServiceRecord> = await Static.get(
    CACHE_KEYS.ALL,
  );

  return caches[contractId] as ServiceRecord & { row: R };
};

export const findOrFail = async <R = AnyModel>(contractId: number) => {
  const records = await possibleRecords([contractId]);
  assert(records[contractId], `Section not find for contract:[${contractId}]`);

  return records[contractId] as ServiceRecord<R>;
};

const possibleRecords = async (contracts: number[] = []) => {
  const where = contracts.length > 0 ? { contractId: contracts } : {};

  const items = await GfContractSectionStatus.findAll({
    where,
    include: [
      {
        model: GfSection,
        as: 'section',
        required: true,
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

  return prepareRecords(items);
};

const prepareRecords = async (records: AnyModel[]) => {
  const serviceRecords: Record<number | string, ServiceRecord> = {};

  for (const item of records) {
    const sectionCode: SERVICE = item.section.code;

    serviceRecords[item.contractId] = {
      type: sectionCode,
      row: item.contract?.[DATA_SECTION[sectionCode]],
      contract: item.contract,
      status: item,
    };
  }

  return serviceRecords;
};
