import { AnyModel, intranet } from '@api/models';
import { associateBy, pluck } from '@api/utils/collections';
import { groupBy, values } from 'lodash';
import {
  setBlockedState,
  setDoneState,
  setEmptyState,
  setPendingState,
  setSuspendedState,
} from '../GfContractSectionStatusService';

import { CELL_PROVIDER_CODE } from '@api/constants/contracts';
import { CONTRACT } from '@api/constants/statuses';
import { CellRevisionError } from '@api/models/intranet/intranet_cell_revision_error';
import { GfActiveFee } from '@api/models/intranet/intranet_active_fee';
import { GfCellProvider } from '@api/models/intranet/intranet_gf_cell_providers';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GfContractDataCell } from '@api/models/intranet/intranet_gf_contract_data_cell';
import { GfFeeGroup } from '@api/models/intranet/intranet_gf_fee_groups';
import { GfSection } from '@api/models/intranet/intranet_gf_sections';
import { LemonLine } from '@api/models/intranet/intranet_lemon_line';
import { Op } from 'sequelize';
import { RevisionGroup } from '@api/constants/enum';
import { Static } from '@lib/cache';
import { handle as SuspendContracts } from './SuspendContracts';
import { handle as SyncLemonBonuses } from './SyncLemonBonuses';
import { handle as SyncLemonFees } from './SyncLemonFees';
import assert from 'assert';
import { ensureOfDocument } from '../GfContractDataCellService';
import { generateContractPointers } from '../Invoice_GfPointerService';
import moment from 'moment';
import { onAfterInsert } from '../GfContractService';
import to from 'await-to-js';

const { GfContract, transaction } = intranet;

/**
 * Revision given lemon contracts.
 */
export const handle = async (lines: LemonLine[], userId = 0) => {
  const [sectionId, clients, reviewedContracts] = await Promise.all([
    await getSectionId(),
    await getClientIds(pluck(lines, 'fiscal_id')),
    await getReviewedContracts(pluck(lines, 'number')),
    await CellRevisionError.destroy({
      where: {
        number: pluck(lines, 'number'),
        fiscal_id: pluck(lines, 'fiscal_id'),
      },
    }),
  ]);

  const reviewedContractKeys = Object.keys(reviewedContracts);

  // import lemon lines
  const results = reportErrors(
    await Promise.allSettled(
      lines.map(async (line) => {
        const key = `${line.number}-${line.fiscal_id}-${Number(line.active)}`;
        // if the line is already reviewed, we just update the contract
        if (reviewedContractKeys.includes(key)) {
          return revisionContract(
            line,
            reviewedContracts[key],
            sectionId,
            userId,
          );
        }
        // if the line is not active, we check for the reverse state
        const reverseStateKey = `${line.number}-${line.fiscal_id}-${Number(
          !line.active,
        )}`;

        if (reviewedContractKeys.includes(reverseStateKey)) {
          return revisionContract(
            line,
            reviewedContracts[reverseStateKey],
            sectionId,
            userId,
          );
        }
        // ensure client exists
        if (!clients[line.fiscal_id]) {
          const error = `[RevisionLemonContracts][handle] Client by fiscal id [${line.fiscal_id}] not found!`;

          reportRevisionError(line, RevisionGroup.CLIENT, error);

          throw new Error(error);
        }
        // if the line is not reviewed, we create a new contract
        const { dataCell, contract } = await createContract(
          line,
          clients[line.fiscal_id] as number,
          userId,
        );

        reviewedContracts[key] = {
          id: dataCell.id,
          number: dataCell.number,
          contractId: dataCell.contractId,
          contract: { state: contract.get('state') },
        };

        return revisionContract(
          line,
          reviewedContracts[key],
          sectionId,
          userId,
        );
      }),
    ),
  );
  // sync bonuses
  const [error] = await to(SyncLemonBonuses(lines));
  if (error) {
    console.error(error);
  }
  // update fees
  const [syncFeeError] = await to(SyncLemonFees(lines));
  if (syncFeeError) {
    console.error(syncFeeError);
  }

  await removeDuplicatedActiveContracts(lines, clients);

  return results;
};

const reportErrors = (
  results: PromiseSettledResult<void>[],
): PromiseSettledResult<void>[] => {
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error(result.reason);
    }
  });

  return results;
};

const revisionContract = async (
  line: LemonLine,
  dataCell: GfContractDataCell,
  sectionId: number,
  userId: number,
) => {
  await validateLine(line);

  const icc = getIccFromLine(line);
  // update iccc if required
  if (icc && dataCell.iccPlusControlDigit != icc) {
    await GfContractDataCell.update(
      { iccPlusControlDigit: icc },
      { where: { id: dataCell.id } },
    );
  }

  const isActiveContract = dataCell.contract!.state === CONTRACT.ACTIVE;
  // sync together
  if (line.gf_contract_id !== dataCell.contractId) {
    await line.update({ gf_contract_id: dataCell.contractId });
  }
  // on the right state
  if (isActiveContract && line.isActive() && !line.isPending()) {
    // set activation date
    await GfContract.update(
      { dateActivation: moment(line.creation_date).toISOString() },
      { where: { id: dataCell.contractId } },
    );
    return;
  }
  // update contract state
  if (line.isPending()) {
    return setPendingState(dataCell.contractId, sectionId, userId);
  } else if (line.isActive()) {
    // set activation date
    await GfContract.update(
      { dateActivation: moment(line.creation_date).toISOString() },
      { where: { id: dataCell.contractId } },
    );
    // activate contract
    return setDoneState(dataCell.contractId, sectionId, userId);
  } else if (line.isBlocked()) {
    // set activation date
    await GfContract.update(
      { dateActivation: moment(line.creation_date).toISOString() },
      { where: { id: dataCell.contractId } },
    );
    // block contract
    return setBlockedState(dataCell.contractId, sectionId, userId);
  } else if (dataCell.contract!.state !== CONTRACT.SUSPENDED) {
    // set deactivation date
    await GfContract.update(
      { dateDeactivation: moment(line.termination_date).toISOString() },
      { where: { id: dataCell.contractId } },
    );
    // suspend contract
    return suspendContract(dataCell.contractId, userId);
  }
};

const suspendContract = async (contractId: number, userId: number) => {
  const contract = await GfContract.findByPk(contractId);
  assert(
    contract,
    `[RevisionLemonContracts][suspendContract] Missing contract for id:${contractId}`,
  );

  await SuspendContracts([contract], userId);
  // missing fee group causes error to set section status
  if (!contract.feeGroupId) {
    return;
  }
  await setSuspendedState(contract.id, await getSectionId(), userId);
  if (!contract.isSuspended()) {
    await generateContractPointers(contract.id, true);
  }
};

const getSectionId = async (): Promise<number> => {
  return Static.sear('cell_section_id', async () => {
    const section = await GfSection.findByCode('CELL');

    assert(section, 'CELL section not found');

    return section.id;
  });
};

const getClientIds = async (fiscalIds: string[]) => {
  return pluck(
    await GfClient.findAll({
      where: { fiscalId: fiscalIds },
      raw: true,
    }),
    'id',
    'fiscalId',
  );
};

const getReviewedContracts = async (numbers: string[]) => {
  return associateBy(
    await GfContractDataCell.findAll({
      raw: true,
      nest: true,
      attributes: ['number', 'id', 'contractId'],
      where: { number: numbers },
      include: [
        {
          model: GfContract,
          as: 'contract',
          required: true,
          attributes: ['state'],
          include: [
            {
              model: GfActiveFee,
              as: 'activeFee',
              required: true,
              attributes: ['id'],
              include: [
                {
                  model: GfCellProvider,
                  as: 'cellProvider',
                  required: true,
                  attributes: ['id'],
                  where: { code: CELL_PROVIDER_CODE.LEMON },
                },
              ],
            },
            {
              model: GfClient,
              as: 'client',
              required: true,
            },
          ],
        },
      ],
    }),
    ({ number, contract }) => {
      const suspended = contract?.state === CONTRACT.SUSPENDED;
      // if suspended, we use 0, otherwise 1
      return `${number}-${contract?.client?.fiscalId}-${
        Number(suspended) ? 0 : 1
      }`;
    },
  );
};

const createContract = async (
  line: LemonLine,
  clientId: number,
  userId: number,
) => {
  await validateLine(line);

  const feeGroup = await getFeeGroupOrFail(line);

  return transaction<{ contract: AnyModel; dataCell: GfContractDataCell }>(
    async () => {
      const contract = await createGfContract(
        line,
        clientId,
        userId,
        feeGroup.id,
      );
      await onAfterInsert(contract, userId);

      const dataCell = await createDataCell(contract.id, line);

      await setEmptyState(contract.id, await getSectionId(), userId);
      await ensureOfDocument(dataCell);

      return { contract, dataCell };
    },
  );
};

const getIccFromLine = (line: LemonLine) => line.data.sim?.[0]?.ICC;

async function validateLine(line: LemonLine) {
  if (line.isActive() && !line.isPending() && !getIccFromLine(line)) {
    const error = `Missing ICC for line ${line.number}`;
    await reportRevisionError(line, RevisionGroup.SIM, error);
    throw new Error(error);
  }
}

async function getFeeGroupOrFail(line: LemonLine) {
  const feeGroup = await GfFeeGroup.getCellActualFeeGroup(line.packageId);
  if (!feeGroup) {
    const error = `[RevisionLemonContracts][createContract]: Missing fee group for package [${line.packageId}]`;
    await reportRevisionError(line, RevisionGroup.FEE, error);
    throw new Error(error);
  }
  return feeGroup;
}

async function createGfContract(
  line: LemonLine,
  clientId: number,
  userId: number,
  feeGroupId: number,
) {
  return GfContract.create({
    userId,
    clientId,
    feeGroupId,
    imported: 1,
    payDay: 1,
    invoiceMonths: 1001,
    dateDeactivation: line.termination_date
      ? moment(line.termination_date)
      : null,
    dateActivation: line.creation_date ? moment(line.creation_date) : null,
    comments: `Imported from the Lemon API on "${moment().toISOString()}" by the system`,
  });
}

async function createDataCell(contractId: number, line: LemonLine) {
  return GfContractDataCell.create({
    contractId,
    number: line.number,
    portability: line.portable,
    iccPlusControlDigit: getIccFromLine(line),
  });
}

async function reportRevisionError(
  line: LemonLine,
  group: RevisionGroup,
  error: string,
) {
  return CellRevisionError.create({
    fiscal_id: line.fiscal_id,
    number: line.number,
    group,
    provider: CELL_PROVIDER_CODE.LEMON,
    fee: line.packageId,
    error,
  });
}

const removeDuplicatedActiveContracts = async (
  lines: LemonLine[],
  clientsByFiscalId: Record<string, number>,
) => {
  // which client(s) are included in this import batch?
  const clientIds = Array.from(
    new Set(
      lines
        .map((l) => clientsByFiscalId[l.fiscal_id])
        .filter((id): id is number => Boolean(id)),
    ),
  );

  // if we cannot resolve the client, do nothing (safer than disabling others)
  if (!clientIds.length) return;

  const dataCells = await GfContractDataCell.findAll({
    where: {
      number: pluck(lines, 'number'),
      contractId: { [Op.notIn]: pluck(lines, 'gf_contract_id') },
    },
    include: [
      {
        model: GfContract,
        as: 'contract',
        required: true,
        attributes: ['id'],
        where: {
          clientId: clientIds,
          state: [CONTRACT.ACTIVE, CONTRACT.SUSPENDED, CONTRACT.BLOCKED],
        },
        include: [
          {
            model: GfActiveFee,
            as: 'activeFee',
            required: true,
            attributes: ['id'],
            include: [
              {
                model: GfCellProvider,
                as: 'cellProvider',
                required: true,
                attributes: ['id'],
                where: { code: CELL_PROVIDER_CODE.LEMON },
              },
            ],
          },
        ],
      },
    ],
  });

  await GfContract.update(
    { status: 0 },
    { where: { id: pluck(dataCells, 'contractId') } },
  );
};
