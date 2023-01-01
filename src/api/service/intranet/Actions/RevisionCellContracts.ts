import { AnyModel, intranet } from '@api/models';
import {
  Line,
  RequestLine,
  SIM_ROLE,
  SIM_STATE,
  STATE,
  TIPO,
} from '@delinternet/sdk-aire';
import { checkCancellationEvent, syncComments } from '../AireSolicitudeService';
import { firstPopulated, throwIf } from '@api/utils/helpers';
import {
  setBlockedState,
  setDoneState,
  setEmptyState,
  setSuspendedState,
} from '../GfContractSectionStatusService';

import { AireDataDeserializeError } from './Errors/AireDataDeserializeError';
import { AireRequest } from '@api/models/global/global_aire_requests';
import { AireSyncError } from './Errors/AireSyncError';
import { CELL_PROVIDER_CODE } from '@api/constants/contracts';
import { CONTRACT } from '@api/constants/statuses';
import { CellRevisionError } from '@api/models/intranet/intranet_cell_revision_error';
import { ClientSynchronizationError } from './Errors/ClientSynchronizationError';
import { DuplicateClientError } from './Errors/DuplicateClientError';
import { DuplicationOnExecutingError } from './Errors/DuplicationOnExecutingError';
import { DuplicationOnSuspendingError } from './Errors/DuplicationOnSuspendingError';
import { GfActiveFee } from '@api/models/intranet/intranet_active_fee';
import { GfAireContract } from '@api/models/intranet/intranet_gf_aire_contracts';
import { GfCellProvider } from '@api/models/intranet/intranet_gf_cell_providers';
import { GfFeeGroup } from '@api/models/intranet/intranet_gf_fee_groups';
import { MismatchRequestLine } from './Errors/MismatchRequestLine';
import { MismatchTarifa } from './Errors/MismatchTarifa';
import { MissingTarifa } from './Errors/MissingTarifa';
import { Op } from 'sequelize';
import { RevisionGroup } from '@api/constants/enum';
import { Static } from '@lib/cache';
import { handle as SuspendContracts } from './SuspendContracts';
import { handle as SyncAireBonuses } from './SyncAireBonuses';
import { handle as SyncAireTarifas } from './SyncAireTarifas';
import assert from 'assert';
import { compareDates } from '@api/utils/dates';
import { ensureOfDocument } from '../GfContractDataCellService';
import { generateContractPointers } from '../Invoice_GfPointerService';
import moment from 'moment';
import { onAfterInsert } from '../GfContractService';
import to from 'await-to-js';

const {
  GfContract,
  GfClient,
  GfContractDataCell,
  GfSection,
  GfAireContractSyncError,
  transaction,
} = intranet;

let actualFeeGroups: Record<string, GfFeeGroup | null> = {};

/**
 * Revision given aire contracts.
 */
export const handle = async (aireContracts: GfAireContract[], userId = 0) => {
  // clean old sync errors
  await cleanLogs(aireContracts);
  await setupCache(aireContracts);
  const validContracts = aireContracts.filter((aireContract) => {
    return aireContract.getAireData();
  });
  // do sync
  for (const aireContract of validContracts) {
    // validate contracts
    const [validationError] = await to(validateContract(aireContract));
    if (validationError) {
      console.error(validationError);
      continue;
    }
    // sync contracts
    const [error, contract] = await to(
      findOrCreateContract(aireContract, userId),
    );

    if (error) {
      await handleError(error, aireContract.getAireData()!);
    } else {
      await revisionTheContract(contract, aireContract, userId);
    }
  }

  await clearCaches();
  await removeDuplicates(aireContracts);
  await SyncAireTarifas(aireContracts);
  await SyncAireBonuses(aireContracts);
  await ensureOfDocuments(aireContracts.map(({ id }) => id));
};

const validateContract = async (aireContract: GfAireContract) => {
  const line = aireContract.getAireData()!;
  // invalid client
  assert(line.fiscalId, 'Missing fiscal id');

  if (await isOurClient(line.fiscalId)) {
    return;
  }

  const error = `Client by fiscal id "${line.fiscalId}" not found.`;

  await reportRevisionError(line, RevisionGroup.CLIENT, error);

  throw new Error(error);
};

const cleanLogs = async (aireContracts: GfAireContract[]) => {
  await GfAireContractSyncError.destroy({
    where: { number: aireContracts.map(({ number }) => number) },
  });
};

const setupCache = async (aireContracts: GfAireContract[]) => {
  actualFeeGroups = {};
  await Static.sear(
    'RevisionCellContracts@linkedContracts',
    async () => {
      return GfContract.findAll({
        where: {
          id: aireContracts.map(({ linkedContractId }) => linkedContractId),
        },
        attributes: [
          'id',
          'linkedContractId',
          'reference',
          'imported',
          'clientId',
          'feeGroupId',
          'dateActivation',
          'dateDeactivation',
          'state',
          'status',
        ],
      });
    },
    1200,
    true,
  );
  await Static.sear(
    'RevisionCellContracts@cellSectionId',
    async () => {
      //@ts-ignore
      return GfSection.findByCode('CELL');
    },
    1200,
    true,
  );
  await Static.sear(
    'RevisionCellContracts@requests',
    async () => {
      return AireRequest.findAll({
        where: {
          number: aireContracts.map(({ number }) => number),
        },
      });
    },
    1200,
    true,
  );
  await Static.sear(
    'RevisionCellContracts@clients',
    async () => {
      return GfClient.findAll({
        where: {
          fiscalId: aireContracts.map(
            (aireContract) => aireContract.getAireData()?.fiscalId,
          ),
        },
        attributes: ['id', 'fiscalId', 'aireCode'],
      });
    },
    1200,
    true,
  );
};

const isOurClient = async (fiscalId: string): Promise<boolean> => {
  return (await getPossibleClients(fiscalId)).length > 0;
};

const findOrCreateContract = async (
  aireContract: GfAireContract,
  userId: number,
): Promise<AnyModel> => {
  // Find currently linked contract, if any
  const currentlyLinkedContract = await findCurrentlyLinkedContract(
    aireContract,
  );
  if (currentlyLinkedContract) {
    return currentlyLinkedContract;
  }
  // Find any possible contract
  const possibleContract = await findPossibleContract(aireContract);
  if (possibleContract) {
    return possibleContract;
  }
  // Build and create a new contract
  return createNewContract(aireContract, userId);
};

const findCurrentlyLinkedContract = async (aireContract: GfAireContract) => {
  const cachedContracts = await Static.get<AnyModel[], []>(
    'RevisionCellContracts@linkedContracts',
    [],
  );

  return cachedContracts.find((contract) => {
    if (contract.id !== aireContract.linkedContractId) {
      return false;
    }
    // check if its in the correct state
    return aireContract.isActive()
      ? contract.isAvailable()
      : contract.isSuspended();
  });
};

const findPossibleContract = async (aireContract: GfAireContract) => {
  const aireLine = aireContract.getAireData();
  assert(
    aireLine,
    new AireDataDeserializeError(aireContract.id, aireContract.number),
  );

  return aireContract.active
    ? findPossbileActiveContract(aireLine)
    : findPossbileInactiveContract(aireLine);
};

const findPossbileActiveContract = async (aireLine: Line) => {
  const possibles = await getPossibleContracts(
    aireLine.telefono,
    aireLine.fiscalId,
  );
  // already activated
  const activeContracts = possibles.filter((contract) => {
    return contract.isAvailable();
  });
  if (activeContracts.length > 0) {
    return activeContracts.sort((a) => (a.isActive() ? -1 : 0))[0];
  }
  // pedning to activations
  const pendings = possibles.filter((contract) => {
    return contract.isPendingSectionsReady();
  });

  if (pendings.length > 0 && activeContracts.length > 1) {
    await reportRevisionError(
      aireLine,
      RevisionGroup.EXECUTION,
      'There is more than one local contract pending execution',
    );
  }

  if (pendings.length > 0) {
    throwIf(activeContracts.length > 1, DuplicationOnExecutingError);
    return pendings[0];
  }
  // wrong suspensions
  const suspendContracts = possibles.filter((contract) => {
    if (!contract.isSuspended() || contract.GfAireContract) {
      return false;
    }

    return compareDates(contract.dateActivation, aireLine.fecha_alta);
  });
  if (suspendContracts.length > 0) {
    return suspendContracts[0];
  }
  // wrong deletions
  return restoreFromTrashes(aireLine.telefono, aireLine.fiscalId, [
    CONTRACT.ACTIVE,
    CONTRACT.PENDING_SECTION_READY,
  ]);
};

const findPossbileInactiveContract = async (aireLine: Line) => {
  // suspend active contract if not found active line
  const hasActiveLine = await GfAireContract.findOne({
    where: {
      number: aireLine.telefono,
      active: 1,
      aireData: { [Op.like]: `%"${aireLine.fiscalId}"%` },
    },
  });
  if (!hasActiveLine) {
    return findPossbileActiveContract(aireLine);
  }
  // find possibles
  const possibles = await getPossibleContracts(
    aireLine.telefono,
    aireLine.fiscalId,
  );
  // already suspended
  const suspendedContracts = possibles.filter((contract) => {
    return contract.isSuspended() && !contract.GfAireContract;
  });
  if (suspendedContracts.length > 0) {
    return suspendedContracts.sort((a) => {
      return compareDates(a.dateDeactivation, aireLine.fecha_baja) ? -1 : 0;
    })[0];
  }
  // pedning to activations
  const pendings = possibles.filter((contract) => {
    return contract.isPendingSectionsReady();
  });
  if (pendings.length > 0) {
    throwIf(pendings.length > 1, DuplicationOnSuspendingError);
    return pendings[0];
  }
  // wrong deletions
  return restoreFromTrashes(aireLine.telefono, aireLine.fiscalId, [
    CONTRACT.SUSPENDED,
    CONTRACT.PENDING_SECTION_READY,
  ]);
};

const createNewContract = async (
  aireContract: GfAireContract,
  userId: number,
): Promise<AnyModel> => {
  const aireLine = aireContract.getAireData();
  assert(
    aireLine,
    new AireDataDeserializeError(aireContract.id, aireContract.number),
  );
  const client = await getClient(aireContract, aireLine);
  const tarfia = findCompatibleTarifa(aireLine);

  // ensure tarifa
  assert(tarfia, new MissingTarifa(aireContract.id, aireContract.number));
  const feeGroup = await actualFeeGroup(tarfia.siglas);
  // ensure of local fee
  assert(
    feeGroup,
    new MismatchTarifa(aireContract.id, aireContract.number, tarfia),
  );

  const dateActivation = firstPopulated([aireLine.fecha_alta]);
  const dateDeactivation = !aireContract.active
    ? firstPopulated([tarfia.fecha_baja, aireLine.fecha_baja])
    : null;

  const contract = await transaction<AnyModel>(async () => {
    // create contract
    const contract = await GfContract.create({
      clientId: client.id,
      feeGroupId: feeGroup.id,
      imported: 1,
      payDay: 1,
      invoiceMonths: 1001,
      dateDeactivation,
      dateActivation,
    });
    await onAfterInsert(contract, userId);
    // INSERT CELL SECTION
    await GfContractDataCell.create({
      contractId: contract.id,
      number: aireLine.telefono,
    });

    return contract;
  });

  console.log(`Contract with id:${contract.id} created.`);
  // go to the initial state to trigger events
  await setEmptyState(contract.id, await getSectionId(), userId);

  return contract;
};

const getClient = async (aireContract: GfAireContract, aireLine: Line) => {
  const possibleClients = await getPossibleClients(aireLine.fiscalId);
  // search client fiscalId present
  assert(
    possibleClients.length == 1,
    new DuplicateClientError(
      aireContract.id,
      aireContract.number,
      aireLine.fiscalId,
    ),
  );
  // client not synced yet
  assert(
    possibleClients[0].aireCode || !aireContract.isActive(),
    new ClientSynchronizationError(
      aireContract.id,
      aireContract.number,
      aireLine.fiscalId,
    ),
  );

  return possibleClients[0];
};

const getPossibleClients = async (clientFiscalId: string) => {
  const cachedClients = await Static.get<AnyModel[], []>(
    'RevisionCellContracts@clients',
    [],
  );

  return cachedClients.filter(({ fiscalId }) => {
    return String(fiscalId).toLowerCase() === clientFiscalId.toLowerCase();
  });
};

const findCompatibleTarifa = (aireLine: Line) => {
  return Array.from(aireLine.tarifa ?? [])
    .filter(({ fecha_baja }) => aireLine.activo !== 'SI' || !fecha_baja)
    .shift();
};

const actualFeeGroup = async (siglas: string) => {
  if (!actualFeeGroups[siglas]) {
    actualFeeGroups[siglas] = await GfFeeGroup.getCellActualFeeGroup(siglas);
  }
  return actualFeeGroups[siglas];
};

const getPossibleContracts = async (number: string, fiscalId: string) => {
  return GfContract.findAll({
    where: { reference: { [Op.notLike]: '%-aireLink' } },
    include: [
      {
        model: GfContractDataCell,
        as: 'dataCell',
        required: true,
        attributes: ['number', 'linkedAireId', 'lastRevision', 'id'],
        where: { number },
      },
      {
        model: GfClient,
        as: 'client',
        required: true,
        attributes: ['id', 'fiscalId'],
        where: { fiscalId },
      },
      {
        model: GfAireContract,
        required: false,
      },
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
            where: { code: 'aire' },
          },
        ],
      },
    ],
  });
};

const restoreFromTrashes = async (
  number: string,
  fiscalId: string,
  state: CONTRACT[] | CONTRACT,
) => {
  const contract = await GfContract.findOne({
    where: { state, status: 0, reference: { [Op.notLike]: '%-aireLink' } },
    include: [
      {
        model: GfContractDataCell,
        as: 'dataCell',
        required: true,
        attributes: ['number', 'linkedAireId', 'lastRevision', 'id'],
        where: { number },
      },
      {
        model: GfClient,
        as: 'client',
        required: true,
        attributes: ['id', 'fiscalId'],
        where: { fiscalId },
      },
      {
        model: GfAireContract,
        required: false,
      },
    ],
  });

  return contract?.update({ status: 1 });
};

const revisionTheContract = async (
  contract: AnyModel,
  aireContract: GfAireContract,
  userId: number,
) => {
  const aireLine = aireContract.getAireData();
  if (aireContract.linkedContractId !== contract.id) {
    await aireContract.update({ linkedContractId: contract.id });
  }

  assert(aireLine);
  const request = await findCompatibleRequest(aireLine);
  // update the given contract
  const dataCell = await getUpdatedContractData(
    contract,
    aireContract,
    aireLine,
    request,
  );

  const sectionId = await getSectionId();

  if (!aireContract.active) {
    await suspendContract(contract, userId);
  } else if (aireLine.estado_impago) {
    await setBlockedState(contract.id, sectionId, userId);
  } else {
    await setDoneState(contract.id, sectionId, userId);
  }

  // mismatch request line
  if (!request) {
    await handleError(
      new MismatchRequestLine(aireContract.id, aireContract.number),
      aireLine,
    );
  } else if (request.estado === STATE.CANCELED_PORTABILITY) {
    // portability failed
    await checkCancellationEvent(contract.id, userId);
  }
};

const suspendContract = async (contract: AnyModel, userId: number) => {
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

const portabilities = () => {
  return [TIPO.PORTABILITY, TIPO.DISTRIBUTOR_TRANSFER] as string[];
};

const getUpdatedContractData = async (
  contract: AnyModel,
  aireContract: GfAireContract,
  aireLine: Line,
  request: RequestLine | null = null,
) => {
  const dataCell = await GfContractDataCell.findOne({
    where: { contractId: contract.id },
  });
  assert(dataCell);

  contract.set({
    dateActivation: firstPopulated([
      aireLine.fecha_alta,
      contract.dateActivation,
    ]),
    dateDeactivation:
      aireLine.activo === 'NO'
        ? firstPopulated([aireLine.fecha_baja, contract.dateDeactivation])
        : null,
  });

  if (contract.changed()) {
    await contract.save();
  }

  const sim = findCompatibleSim(aireLine);
  await dataCell.set({
    // lastRevision: moment().format('YYYY-MM-DD HH:mm:ss'),
    portability: request
      ? portabilities().includes(request.tipo)
      : dataCell.portability,
    linkedAireId: aireContract.id,
    icc: firstPopulated([sim?.icc, dataCell.icc]),
    iccControlDigit: firstPopulated([sim?.dc, dataCell.iccControlDigit]),
    providerRequestCode: firstPopulated([
      request?.cod,
      dataCell.providerRequestCode,
    ]),
    lastGetStateText: firstPopulated([
      request?.estado,
      dataCell.lastGetStateText,
    ]),
  });

  if (dataCell.changed()) {
    await dataCell.save();
  }

  if (request) {
    await syncComments(request, dataCell);
  }

  return dataCell;
};

const findCompatibleSim = (aireLine: Line) => {
  return Array.from(aireLine.sims ?? [])
    .filter(({ estado }) => estado === SIM_STATE.ACTIVE)
    .sort((a, b) => (a.rol === SIM_ROLE.PRIMARY ? -1 : 0))[0];
};

const findCompatibleRequest = async (
  aireLine: Line,
): Promise<RequestLine | null> => {
  // find latest request
  const request = (await getPossibleReqeusts(aireLine))
    .filter((request) => {
      const dateActivation = request.getAireData()?.fecha_insercion;
      // check active request date
      if (compareDates(dateActivation, aireLine.fecha_alta, '>')) {
        return false;
      }
      // check if reqesut is before deactivation
      if (!aireLine.fecha_baja) {
        return true;
      }
      return compareDates(dateActivation, aireLine.fecha_baja, '<=');
    })
    .sort((a, b) => {
      return compareDates(
        a.getAireData()!.fecha_insercion,
        b.getAireData()!.fecha_insercion,
        '<',
      )
        ? -1
        : 0;
    })
    .pop();

  return request?.getAireData() ?? null;
};

const getPossibleReqeusts = async (aireLine: Line) => {
  const requests = (
    (await Static.get<AireRequest[], []>('RevisionCellContracts@requests')) ??
    []
  ).filter(({ number, fiscal_id }) => {
    return aireLine.telefono === number && aireLine.fiscalId === fiscal_id;
  });

  return requests.filter((request) => {
    return aireLine.activo === 'SI'
      ? request.isActive()
      : request.isTerminated();
  });
};

const getSectionId = async (): Promise<number> => {
  const section = await Static.get<AnyModel>(
    'RevisionCellContracts@cellSectionId',
  );

  assert(section, 'CELL section not found');

  return section.id;
};

const handleError = async (error: Error, line: Line) => {
  if (error instanceof AireSyncError) {
    return GfAireContractSyncError.create(error.jsonSerialize());
  } else {
    console.error(error);
  }
};

const removeDuplicates = async (aireContracts: GfAireContract[]) => {
  const contracts = await GfContract.findAll({
    where: { state: CONTRACT.ACTIVE },
    order: [['creationDate', 'asc']],
    attributes: ['id', 'clientId', 'state'],
    include: [
      {
        model: GfContractDataCell,
        as: 'dataCell',
        attributes: ['number'],
        where: { number: aireContracts.map(({ number }) => number) },
      },
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
            where: { code: 'aire' },
          },
        ],
      },
    ],
  });
  // filter duplicates
  const exists: string[] = [];
  const duplicates = contracts.filter(({ clientId, dataCell }) => {
    const key = `${clientId}:${dataCell.number}`;
    if (!exists.includes(key)) {
      exists.push(key);

      return false;
    }

    return true;
  });
  // remove duplicates
  await GfContract.update(
    { status: 0 },
    { where: { id: duplicates.map(({ id }) => id) } },
  );
};

const ensureOfDocuments = async (aireContracts: number[]) => {
  const dataCells = await GfContractDataCell.findAll({
    where: { linkedAireId: aireContracts },
    attributes: ['id', 'contractId'],
    include: {
      model: GfContract,
      as: 'contract',
      attributes: ['id'],
    },
  });

  for (const dataCell of dataCells) {
    const [error] = await to(ensureOfDocument(dataCell));
    console.assert(
      error === null,
      `There was an error while importing the document for contract[${error?.message}].`,
    );
  }
};

const clearCaches = async () => {
  actualFeeGroups = {};
  await Static.forget('RevisionCellContracts@linkedContracts');
  await Static.forget('RevisionCellContracts@cellSectionId');
  await Static.forget('RevisionCellContracts@requests');
  await Static.forget('RevisionCellContracts@clients');
};

async function reportRevisionError(
  line: Line,
  group: RevisionGroup,
  error: string,
) {
  return CellRevisionError.create({
    fiscal_id: line.fiscalId,
    number: line.telefono,
    group,
    provider: CELL_PROVIDER_CODE.AIRE,
    fee: line.tarifa,
    error,
  });
}
