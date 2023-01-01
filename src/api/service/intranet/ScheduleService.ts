/**
 * put any cron actions builder here
 */

import { AireLine, AireRequestLine } from './AireService';

import { Action } from '@api/models/global/global_action';
import { Bulk } from '@api/models/global/global_bulk';
import { GfDoc } from '@api/models/intranet/intranet_gf_docs';
import { LemonLine } from '@api/models/intranet/intranet_lemon_line';
import { Op } from 'sequelize';
import { OperadorLandline } from '@api/models/intranet/intranet_operador_landline';
import actionRunner from '@lib/action-runner';
import { intranet } from '@api/models';
import { lemon } from '@lib/lemon';
import moment from 'moment';
import { pluck } from '@api/utils/collections';
import { uniq } from 'lodash';

const { GfAireContract, CrmUser } = intranet;

const LADNLINE_REVISION_PER_PAGE = 25;
const REVISION_PER_PAGE = 25;
const AIRE_LINE_PER_PAGE = 50;
const AIRE_REQUEST_PER_PAGE = 50;
const LEMON_REVISION_PER_PAGE = 5;
const TRANSMIT_PER_PAGE = 20;

/**
 * Revision cell contracts by aire lines.
 */
export const revisionCellContracts = async () => {
  const total = await GfAireContract.count();

  await schedule(
    'revision-cell-contracts',
    Array.from({ length: Math.ceil(total / REVISION_PER_PAGE) }, (_, index) => {
      return {
        page: index + 1,
        pageSize: REVISION_PER_PAGE,
      };
    }),
  );
};

/**
 *
 * Store aire lines into the local database.
 */
export const importAireLines = async () => {
  // store action
  const total = await AireLine.count({});

  await schedule(
    'import-aire-lines',
    Array.from(
      { length: Math.ceil(total / AIRE_LINE_PER_PAGE) },
      (_, index) => {
        return {
          page: index + 1,
          pageSize: AIRE_LINE_PER_PAGE,
        };
      },
    ),
  );
};

/**
 *
 * Store aire request into the local database.
 */
export const importAireRequests = async () => {
  const total = await AireRequestLine.count({});

  await schedule(
    'import-aire-requests',
    Array.from(
      { length: Math.ceil(total / AIRE_REQUEST_PER_PAGE) },
      (_, index) => {
        return {
          page: index + 1,
          pageSize: AIRE_REQUEST_PER_PAGE,
        };
      },
    ),
  );
};

/**
 * Revision ladnlines by aire operadors.
 */
export const revisionLandlines = async () => {
  const total = await OperadorLandline.count();

  await schedule(
    'revision-landlines',
    Array.from(
      { length: Math.ceil(total / LADNLINE_REVISION_PER_PAGE) },
      (_, index) => {
        return {
          page: index + 1,
          pageSize: LADNLINE_REVISION_PER_PAGE,
        };
      },
    ),
  );
};

/**
 * Revision cell contracts by lemon API.
 */
export const revisionLemonLines = async (userId?: number) => {
  const apiFiscalIds = pluck((await lemon.cell.getCells()).data, 'fiscal_id');
  const missingFiscalIds = pluck(
    await LemonLine.findAll({
      where: { fiscal_id: { [Op.notIn]: Object.values(apiFiscalIds) } },
      attributes: ['fiscal_id'],
    }),
    'fiscal_id',
  );

  const fiscalIds = uniq(apiFiscalIds.concat(missingFiscalIds));

  await schedule(
    'revision-lemon-lines',
    Array.from(
      { length: Math.ceil(fiscalIds.length / LEMON_REVISION_PER_PAGE) },
      (_, index) => {
        const start = index * LEMON_REVISION_PER_PAGE;

        return {
          fiscalIds: fiscalIds.slice(start, start + LEMON_REVISION_PER_PAGE),
          userId,
        };
      },
    ),
  );
};

/**
 * Revision cell contracts by lemon API.
 */
export const transmitDocumentUploadHistory = async (userId?: number) => {
  const documents = await GfDoc.findAll({
    attributes: ['id'],
    where: {
      uploadHistory: { [Op.or]: [{ [Op.not]: null }, { [Op.not]: '' }] },
    },
  });

  await schedule(
    'transmit-document-upload-histories',
    Array.from(
      { length: Math.ceil(documents.length / TRANSMIT_PER_PAGE) },
      (_, index) => {
        const start = index * TRANSMIT_PER_PAGE;

        return {
          documents: documents
            .slice(start, start + TRANSMIT_PER_PAGE)
            .map(({ id }) => id),
          userId,
        };
      },
    ),
  );
};

/**
 * Schedule moving old data-protection documents to new system!
 */
export const transmitDataProtectionDocument = async (userId?: number) => {
  const documents = await GfDoc.findAll({
    attributes: ['id'],
    where: { type: 'Goufone-Documents-ProteccioDades' },
  });

  await schedule(
    'transmit-data-protection-documents',
    Array.from(
      { length: Math.ceil(documents.length / TRANSMIT_PER_PAGE) },
      (_, index) => {
        const start = index * TRANSMIT_PER_PAGE;

        return {
          documents: documents
            .slice(start, start + TRANSMIT_PER_PAGE)
            .map(({ id }) => id),
          userId,
        };
      },
    ),
  );
};

export const importGoogleCalendarEvents = async () => {
  const crmUsers = await CrmUser.findAll();

  await schedule(
    'import-google-calendar',
    crmUsers.map(({ userId }) => ({ userId })),
  );
};

/**
 * Schedule the generation of contract documents.
 *
 * @param contracts
 */
export const ensureOfContractDocuments = async (contracts: number[]) => {
  await schedule(
    'ensure-of-contract-documents',
    contracts.map((contractId) => ({ contractId })),
  );
};

/**
 * Schedule the generation of document package caches.
 *
 * @param docs
 */
export const ensureOfDocumentPackageCaches = async (packages: string[]) => {
  await schedule(
    'ensure-of-document-package-caches',
    packages.map((packageId) => ({ packageId })),
  );
};

export const deferredIntranetRecordUpdate = async (
  table: string,
  records: Array<{ id: string | number; data: Record<string, unknown> }>,
) => {
  const connection = 'intranet';

  await schedule(
    'deferred-record-update',
    records.map(({ id: keys, data }) => ({ keys, data, connection, table })),
  );
};

export const schedule = async (
  bulkName: string,
  actions: Array<Record<string, unknown>>,
  truncate = 7,
  scheduledFor?: string,
) => {
  const { action, bulk } = scheduleNames(bulkName);
  // truncate histoyr
  if (truncate >= 0) {
    await truncateHistory(bulkName, truncate);
  }
  // schedule bulk
  actionRunner.createBulk(
    { creator_id: 0, name: bulk, scheduled_for: scheduledFor },
    actions.map((params) => ({ name: action, params })),
  );
};

const truncateHistory = async (bulkName: string, durability: number) => {
  const { action, bulk } = scheduleNames(bulkName);
  await Action.destroy({
    where: {
      name: action,
      created_at: {
        [Op.lte]: moment().subtract(durability, 'day'),
      },
    },
    force: true,
    logging: console.log,
  });
  await Bulk.destroy({
    where: {
      name: bulk,
      created_at: {
        [Op.lte]: moment().subtract(durability, 'day'),
      },
    },
    force: true,
    logging: console.log,
  });
};

const scheduleNames = (bulk: string) => {
  return {
    action: `${bulk}-action`,
    bulk,
  };
};
