import * as DocumentHelper from '@service/documents/GfDocumentService';

import { BLOCK_STATE, CELL_PROVIDER_CODE } from '@api/constants/contracts';
import {
  EditableServices,
  Feature,
  Functionality,
  SIM_ROLE,
  SIM_STATE,
  StaticServices,
  UnpaidStates,
} from '@delinternet/sdk-aire';
import {
  MovilPortabilityData,
  QueryConfigurationLine,
} from '@del-internet/lemon';
import _, { forIn, groupBy, mapValues, multiply, update } from 'lodash';

import { Aire } from '@lib/sdk';
import { AireLine } from './AireService';
import { AireRequest } from '@api/models/global/global_aire_requests';
import { DocStatus } from '@api/models/intranet/intranet_docs_status';
import { DocumentView } from '../documents/types';
import { GfAireContract } from '@api/models/intranet/intranet_gf_aire_contracts';
import { GfContractDataCell } from '@api/models/intranet/intranet_gf_contract_data_cell';
import { GfDoc } from '@api/models/intranet/intranet_gf_docs';
import { LemonLine } from '@api/models/intranet/intranet_lemon_line';
import ValidationException from '@lib/crud/Exceptions/ValidationException';
import assert from 'assert';
import { errors } from '@api/http/http_errors';
import { intranet } from '@models';
import { lemon } from '@lib/lemon';
import { modelToJson } from '@utils/tools';
import { provider } from './Contract/helpers';
import { respondSuccess } from '@utils/response';
import to from 'await-to-js';

const {
  GfCellProviderFeeBonus,
  GfCellProviderFeeBonusXref,
  GfContract,
  GfContractSectionStatus,
  GfFee,
} = intranet;

/**
 * Your GET endpoint
 * get single internet data record by id
 *
 * id String
 * returns Object
 **/
export const getByContractId = async function (contractId: number) {
  const dataCell = await GfContractDataCell.findOne({
    where: { contractId: contractId },
    include: [
      {
        model: GfContract,
        as: 'contract',
        required: false,
        include: [
          {
            model: GfFee,
            as: 'fees',
          },
          {
            model: GfContractSectionStatus,
            as: 'statuses',
          },
        ],
      },
      {
        model: GfCellProviderFeeBonus,
        as: 'bonuses',
        required: false,
        include: [
          {
            model: GfCellProviderFeeBonusXref,
            as: 'providerXrefs',
            required: false,
          },
        ],
      },
      {
        model: AireRequest,
        required: false,
      },
      {
        model: GfAireContract,
        required: false,
      },
      {
        model: LemonLine,
        required: false,
      },
    ],
  });

  assert(
    dataCell,
    `${GfContractDataCell.name} with contractId:${contractId} was not found`,
  );

  const cellProvider = await provider(contractId);

  let histories: Array<Record<string, string>> = [];
  const additionalInfo: Record<
    string,
    | string
    | number
    | null
    | boolean
    | Array<unknown>
    | Array<Record<string, unknown>>
  > = {
    active: false,
    isBlocked: false,
    blockState: null,
    blockDate: null,
    maximumConsumption: null,
    simCards: [],
    blockHistory: [],
  };

  if (
    cellProvider === CELL_PROVIDER_CODE.LEMON &&
    !!dataCell.portability &&
    dataCell.number
  ) {
    const [error, response] = await to(
      lemon.cell.getPortabilityByNumber(dataCell.number),
    );
    histories = error ? [] : response.data.map(transformLemonHistory);
  }

  if (cellProvider === CELL_PROVIDER_CODE.LEMON) {
    additionalInfo.active = dataCell.LemonLine?.isActive() ?? false;
    additionalInfo.simCards =
      (dataCell.LemonLine?.data?.sim ?? []).map((sim) => ({
        icc: sim.ICC,
        pin1: null,
        pin2: null,
        puk: sim.PUK,
        puk2: null,
        primary: true,
        role: SIM_ROLE.PRIMARY,
        active: true,
        isBlocked: false,
        esim: false,
        validationUrl: null,
      })) ?? [];
  } else {
    const mapBlockStates = {
      SOL: BLOCK_STATE.REQUESTED,
      COR: BLOCK_STATE.CUT,
      CAN: BLOCK_STATE.CANCELED,
      RES: BLOCK_STATE.RESTABLISHED,
    };
    const aireData = dataCell.GfAireContract?.getAireData();

    additionalInfo.maximumConsumption = Number(aireData?.consumo_maximo);
    additionalInfo.active = aireData?.activo === 'SI';
    additionalInfo.isBlocked = aireData?.estado_impago ? true : false;
    additionalInfo.blockDate = aireData?.fecha_corte_impago ?? null;
    additionalInfo.simCards = [];
    additionalInfo.blockState = aireData?.estado_impago
      ? mapBlockStates[aireData?.estado_impago]
      : null;

    additionalInfo.blockHistory = (aireData?.historico_estado_impago ?? []).map(
      (history) => ({
        unpaid_status: history.estado_impago,
        unpaid_request_date: history.fecha_solicitud_impago,
        unpaid_cancellation_date: history.fecha_cancelacion_impago,
        unpaid_cuoff_date: history.fecha_corte_impago,
        unpaid_restored_date: history.fecha_restablecido_impago,
      }),
    );

    for (const sim of aireData?.sims ?? []) {
      const [error, validationUrl] = await to(
        Aire.getESIMRequestURL({ number: dataCell.number, role: sim.rol }),
      );

      additionalInfo.simCards.push({
        icc: sim.icc,
        pin1: sim.pin1,
        pin2: sim.pin2,
        puk: sim.puk,
        puk2: sim.puk2,
        primary: sim.rol === SIM_ROLE.PRIMARY,
        role: sim.rol,
        active: sim.estado === SIM_STATE.ACTIVE,
        isBlocked: sim.estado === SIM_STATE.TEMPORARILY_BLOCKED,
        esim: sim.tipo !== 'fisica',
        validationUrl: validationUrl ?? null,
      });
    }
  }

  const aireBonuses = dataCell.GfAireContract?.bonuses();
  const aireRoamingBonuses = await getAireRoamingBonuses(dataCell.number);

  return respondSuccess({
    ...modelToJson(dataCell),
    provider: cellProvider,
    histories,
    additionalInfo,
    aireBonuses,
    aireRoamingBonuses,
  });
};

export const getAireRoamingBonuses = async (number: string | null) => {
  if (!number) {
    return [];
  }

  const [error, bonuses] = await to(Aire.getLineRoamingBonuses(number));

  if (error) {
    console.warn(error);
  }

  return bonuses ?? [];
};

export const getServices = async (id: number) => {
  const dataCell = await GfContractDataCell.findByPk(id);
  assert(dataCell, new errors.NotFound(`Data CELL with id ${id} not found!`));

  const defaultResponse = respondSuccess(mapValues(Functionality, () => []));

  if (!dataCell.number) {
    return defaultResponse;
  }

  const [error, services] = await to(
    Aire.getServices({ number: dataCell.number }),
  );

  if (error) {
    console.error(error);

    return defaultResponse;
  }

  return respondSuccess(
    groupBy(sanitizeDivertModes(services), 'functionality'),
  );
};

const DIVERT_MODES = ['Cfb', 'Cfnrc', 'Cfnry'];
const sanitizeDivertModes = (services: Feature[]) => {
  const alwaysDivert = services.find(
    ({ featureID, active }) => featureID === 'Cfu' && active === 'true',
  );

  return services.map((service) => {
    if (alwaysDivert && DIVERT_MODES.includes(service.featureID)) {
      service.active = 'true';
    }

    return service;
  });
};

export const setServices = async (
  id: number,
  payload: Record<string, Record<string, unknown>>,
) => {
  const dataCell = await GfContractDataCell.findByPk(id);
  assert(dataCell, new errors.NotFound(`Data CELL with id ${id} not found!`));
  assert(dataCell.number, new errors.BadRequest(`Invalid cell number!`));
  const services: Record<string, string> = {};
  const currents = await Aire.getServices({ number: dataCell.number });
  const alwaysDivert =
    Boolean(payload.Cfu?.active) ||
    DIVERT_MODES.every((mode) => Boolean(payload[mode]?.active));
  const partialDivert = DIVERT_MODES.find((mode) => {
    return Boolean(payload[mode]?.active);
  });

  for (const key in payload) {
    if (StaticServices.includes(key as any)) {
      continue;
    }
    // always divert could not submit with partial diverts
    if (key === 'Cfu' && partialDivert) {
      continue;
    }

    const currentState = currents.find(
      ({ featureID }) => featureID.replace('-PP', '') === key,
    );

    const state = ['true', true, 1, undefined].includes(
      payload[key].active as any,
    )
      ? 'true'
      : 'false';

    if (
      currentState?.active === state &&
      currentState.functionality === Functionality.Activable
    ) {
      continue;
    }

    const valueChanged =
      currentState.extNumber && currentState.extNumber != payload[key].value;

    if (
      currentState?.active === state &&
      currentState.functionality === Functionality.Editable &&
      currentState.extString === payload[key].extension &&
      (key !== 'Cfnry' || !valueChanged)
    ) {
      continue;
    }

    if (alwaysDivert && DIVERT_MODES.includes(key)) {
      continue;
    }

    const serviceKey = ['ShortMessageMT', 'ShortMessageMO'].includes(key as any)
      ? `${key}-PP`
      : key;

    services[`${serviceKey}Active`] = state;

    if (!EditableServices.includes(serviceKey as any)) {
      continue;
    }

    if (state !== 'true') {
      services[`${serviceKey}ExtNumber`] = '';
      services[`${serviceKey}extString`] = '';

      continue;
    }

    services[`${serviceKey}ExtNumber`] = payload[serviceKey]
      .extension as string;

    if (payload[serviceKey].value) {
      services[`${serviceKey}ExtNumber`] =
        key !== 'Cfnry'
          ? (payload[serviceKey].value as string)
          : (`${payload[serviceKey].value}s` as string);
      services[`${serviceKey}extString`] = payload[serviceKey]
        .extension as string;
    } else {
      services[`${serviceKey}extString`] = payload[serviceKey]
        .extension as string;
    }
  }

  if (Object.keys(services).length) {
    console.debug(
      `Setting services for data cell ${dataCell.number}`,
      services,
    );

    const result = await Aire.setServices({
      services,
      number: dataCell.number,
    });
  }

  return respondSuccess(modelToJson(dataCell));
};

export const getLemonServices = async (id: number) => {
  const dataCell = await GfContractDataCell.findByPk(id);
  assert(dataCell, new errors.NotFound(`Data CELL with id ${id} not found!`));
  assert(dataCell.number, new errors.BadRequest(`Invalid cell number!`));

  const { data } = await lemon.cell.getServices(dataCell.number);

  return respondSuccess(data);
};

export const setLemonServices = async (
  id: number,
  payload: QueryConfigurationLine,
) => {
  const dataCell = await GfContractDataCell.findByPk(id);
  assert(dataCell, new errors.NotFound(`Data CELL with id ${id} not found!`));
  assert(dataCell.number, new errors.BadRequest(`Invalid cell number!`));
  const { data: currentState } = await lemon.cell.getServices(dataCell.number);

  for (const key in currentState) {
    if (_.isEqual(currentState[key], payload[key])) {
      delete payload[key];
    }
  }
  const [error, response] = await to(
    lemon.cell.updateServices(dataCell.number, payload),
  );

  if (error === null) {
    return respondSuccess(response.data);
  }
  // if error is 400, we can return the response
  // otherwise we throw the error
  if (error.code === 400) {
    throw new errors.BadRequest(
      Object.values(error.data).flat()[0] ?? 'Validation error',
    );
  }

  throw error;
};

export const transformLemonHistory = (history: MovilPortabilityData) => {
  return {
    oldState: history.oldStatus,
    newState: history.newStatus,
    date: history.fecha,
    message: history.mensaje,
  };
};

/**
 *
 * update a internet data record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected internet data (optional)
 * returns Object
 **/
export const createOnOldWeb = async function () {
  // sync with old web
};

export const ensureOfDocument = async function (dataCell: GfContractDataCell) {
  const [cellProvider, contract] = await Promise.all([
    provider(dataCell.contractId),
    GfContract.findByPk(dataCell.contractId),
  ]);

  if (cellProvider === CELL_PROVIDER_CODE.LEMON && dataCell.portability) {
    return DocumentHelper.createDoc({
      action: 'PORTABILIDAD',
      clientId: contract.clientId,
      contractId: contract.id,
      sectionCode: 'CELL',
    });
  }

  await DocumentHelper.createDoc({
    action: 'CONTRATO',
    clientId: contract.clientId,
    contractId: contract.id,
    sectionCode: 'CELL',
  });

  if (dataCell.portability === 1) {
    await DocumentHelper.createDoc({
      action: 'PORTABILIDAD',
      clientId: contract.clientId,
      contractId: contract.id,
      sectionCode: 'CELL',
    });
  }

  return { success: true };
};

const unpaidStateMap = {
  SOL: 'REQUESTED',
  CAN: 'CANCELLED',
  COR: 'CUTTED',
  RES: 'RE-ESTABLISHED',
} as const;

export const getUnpaidState = async (contractId: number) => {
  const dataCell = await GfContractDataCell.findOne({
    where: {
      contractId,
    },
  });

  if (!dataCell) {
    throw new errors.NotFound(
      `dataCell with contractId:${contractId} not found`,
    );
  }

  const line = await AireLine.findOne({
    telefono: dataCell.number,
  });

  if (!line) {
    throw new errors.NotFound(
      `AireLine with telefono:${dataCell.number} not found`,
    );
  }

  const t = (state: UnpaidStates) => unpaidStateMap[state];

  const history =
    line.historico_estado_impago?.map((history) => ({
      state: t(history.estado_impago),
      requestDate: new Date(history.fecha_solicitud_impago),
    })) ?? [];

  const unpaidState = line.estado_impago ? t(line.estado_impago) : null;

  return {
    unpaidState: unpaidState ?? history[0]?.state ?? 'RE-ESTABLISHED',
    history,
  };
};

export async function getCellContractDocs(
  contractId: number,
): Promise<DocumentView[]> {
  const docs = await GfDoc.findAll({
    where: {
      type: [
        'Goufone-Documents-CellContrato',
        'Goufone-Documents-CellPortabilidad',
      ],
      contractId,
    },
    include: [
      {
        model: DocStatus,
        as: 'docStatus',
        required: true,
      },
    ],
    order: [['id', 'DESC']],
  });

  return docs.map(GfDoc.toDocumentView);
}
