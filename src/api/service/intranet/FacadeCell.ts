import { AnyModel, intranet } from '@api/models';

import { Aire } from '@lib/sdk';
import { AireLine } from './AireService';
import { CELL_PROVIDER_CODE } from '@api/constants/contracts';
import CounterService from '../global/CounterService';
import { GfCellProviderFee } from '@api/models/intranet/intranet_gf_cell_providers_fees';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GfContractDataCell } from '@api/models/intranet/intranet_gf_contract_data_cell';
import { Line } from '@delinternet/sdk-aire';
import { Moment } from '../stats/StatsDashboardService';
import { Op } from 'sequelize';
import OptimizedGlobalCounterService from '../global/OptimizedGlobalCounterService';
import { handle as SyncAireBonusInvoiceProducts } from './Actions/SyncAireBonusInvoiceProducts';
import _ from 'lodash';
import assert from 'assert';
import { getLineas } from './Aire/AireFileService';
import { hydrate } from './GfClientService';

const { GfCellProviderFeeBonus, GfAireInvoiceLine, GfAireCdr2 } = intranet;

const AllFees: Record<string, GfCellProviderFee> = {};
const AllBunuses: Record<string, AnyModel> = {};

export type InvoiceLine = {
  tpvId: string;
  productKey: string;
  description: string;
  total: number;
};

export const initAllCellProviderFees = async (force = false) => {
  if (!Object.keys(AllFees).length || force) {
    const fees = await GfCellProviderFee.findAll();
    fees.forEach((fee) => {
      AllFees[fee.providerFeeId] = fee;
    });
  }
};

export const initAllBunuses = async (force = false) => {
  if (!Object.keys(AllBunuses).length || force) {
    const bonos = await GfCellProviderFeeBonus.findAll();
    bonos.forEach((bono) => {
      AllBunuses[bono.providerBonusId] = bono;
    });
  }
};

export const getILines = async (
  number: string,
  nif: string,
  date: Moment,
  providerCode: CELL_PROVIDER_CODE,
) => {
  const line = await getAireInvoiceLineToInvoice(
    number,
    nif,
    date,
    providerCode,
  );

  if (line) {
    const aireInvoiceLines = await _getAireIlines(line);
    line.state = 'procesed_aire';
    await OptimizedGlobalCounterService.tick(
      'Invoice_GfPeriodsManager_progress_aire_invocie_line_' + line.periodId,
    );

    return { ...aireInvoiceLines, invoiceLineRow: line };
  }

  return 'not found';
};

const getAireInvoiceLineToInvoice = async (
  number: string,
  nif: string,
  date: Moment,
  providerCode: CELL_PROVIDER_CODE,
) => {
  const lines = await GfAireInvoiceLine.findAll({
    where: {
      number,
      fiscalId: nif,
      providerCode,
      month: date.month() + 1,
      year: date.year(),
      state: { [Op.or]: [{ [Op.is]: null }, ''] },
    },
  });

  if (lines.length > 1)
    throw new Error(
      `Found more than 1 row on gf_aire_invoice_lines (${JSON.stringify({
        number,
        fiscalId: nif,
        providerCode,
        month: date.month() + 1,
        year: date.year(),
      })})`,
    );

  if (lines.length === 0) return null;

  return lines[0];
};

const _getAireIlines = async (line: AnyModel) => {
  const data = JSON.parse(line.data);
  let total = 0;
  await initAllBunuses();
  await initAllCellProviderFees();
  const consumptionAbstract: Array<InvoiceLine> = [];
  const consumo_voz = Number(data?.consumos?.consumo_voz ?? '0');
  if (consumo_voz) {
    consumptionAbstract.push({
      tpvId: 'CONSUMVEU',
      productKey: `aire_cons:CONSUMOS VOZ:invoice_lines:${line.id}`,
      description: 'CONSUMOS VOZ',
      total: consumo_voz,
    });

    total += consumo_voz;
  }

  const consumo_sms = Number(data?.consumos?.consumo_sms ?? '0');
  if (consumo_sms) {
    consumptionAbstract.push({
      tpvId: 'CONSUMSMS',
      productKey: `aire_cons:CONSUMOS SMS:invoice_lines:${line.id}`,
      description: 'CONSUMOS SMS',
      total: consumo_sms,
    });

    total += consumo_sms;
  }

  const consumo_datos = Number(data?.consumos?.consumo_datos ?? '0');
  if (consumo_datos) {
    consumptionAbstract.push({
      tpvId: 'CONSUMDAD',
      productKey: `aire_cons:CONSUMOS DATOS:invoice_lines:${line.id}`,
      description: 'CONSUMOS DATOS',
      total: consumo_datos,
    });

    total += consumo_datos;
  }

  const roaming = Number(data?.consumos?.consumo_total ?? '0') - total;
  if (roaming > 0) {
    consumptionAbstract.push({
      tpvId: 'ROAMING',
      productKey: `aire_cons:ROAMING:invoice_lines:${line.id}`,
      description: 'ROAMING',
      total: Math.round(Number(roaming.toFixed(4)) * 100) / 100,
    });
  }
  const feeAbstract: Record<string, InvoiceLine> = {};

  for (const tf of data?.tarifas ?? []) {
    const tpvId = AllFees[tf.siglas_tarifa]?.tpvCode ?? null;
    if (!tpvId)
      throw new Error(`aire_fee:${tf.siglas_tarifa}:invoice_lines:${line.id}`);

    feeAbstract[tpvId] = {
      tpvId,
      productKey: `aire_fee:${tf.siglas_tarifa}:invoice_lines:${line.id}`,
      description: tf.nombre_tarifa,
      total: Number(tf.pvp),
    };
    total += Number(tf.pvp);
  }

  const bonosAbstract: Record<string, InvoiceLine[]> = {};
  for (const bono of data?.bonos ?? []) {
    let tpvId = AllBunuses[bono.id_bono]?.tpvCode ?? null;
    if (!tpvId) {
      const newBono = await GfCellProviderFeeBonus.create({
        providerBonusId: bono.id_bono,
        name: bono.nombre_bono,
        pvp: Number(bono.pvp),
        bonusType: bono.tipo_bono,
        providerState: 0,
        tpvCode: bono.id_bono,
      });

      await SyncAireBonusInvoiceProducts([newBono]);

      AllBunuses[bono.id_bono] = newBono;
      tpvId = bono.id_bono;
    }
    const bonoAbstractTpvInfo = bonosAbstract[tpvId] ?? [];
    bonoAbstractTpvInfo.push({
      tpvId,
      productKey: `aire_bono:${tpvId}:invoice_lines:${line.id}`,
      description: bono.nombre_bono,
      total: bono.pvp,
    });
    _.set(bonosAbstract, `${tpvId}`, bonoAbstractTpvInfo);
    total += Number(bono.pvp);
  }

  bonosAbstract.ip_fija = [];
  for (const ip_fija of data?.ip_fija ?? []) {
    bonosAbstract.ip_fija.push({
      tpvId: 'ipFija',
      productKey: `aire_bono:ipFija:invoice_lines:${line.id}`,
      description: ip_fija.concepto,
      total: Number(ip_fija.pvp),
    });

    total += Number(ip_fija.pvp);
  }

  bonosAbstract.ServeiDualSIM = [];
  for (const multisim of data?.multisim ?? []) {
    bonosAbstract.ServeiDualSIM.push({
      tpvId: 'ServeiDualSIM',
      productKey: `aire_bono:ServeiDualSIM:invoice_lines:${line.id}`,
      description: multisim.concepto,
      total: Number(multisim.pvp),
    });

    total += Number(multisim.pvp);
  }

  bonosAbstract.numerosCortosMovil = [];
  for (const numeros_cortos_movil of data?.numeros_cortos_movil ?? []) {
    bonosAbstract.numerosCortosMovil.push({
      tpvId: 'numerosCortosMovil',
      productKey: `aire_bono:numerosCortosMovil:invoice_lines:${line.id}`,
      description: numeros_cortos_movil.concepto,
      total: Number(numeros_cortos_movil.pvp),
    });

    total += Number(numeros_cortos_movil.pvp);
  }

  bonosAbstract.numerosCortosFijos = [];
  for (const numeros_cortos_fijos of data?.numeros_cortos_fijos ?? []) {
    bonosAbstract.numerosCortosFijos.push({
      tpvId: 'numerosCortosFijos',
      productKey: `aire_bono:numerosCortosFijos:invoice_lines:${line.id}`,
      description: numeros_cortos_fijos.concepto,
      total: Number(numeros_cortos_fijos.pvp),
    });

    total += Number(numeros_cortos_fijos.pvp);
  }

  bonosAbstract.transferenciaLlamada = [];
  for (const transferencia_llamada of data?.transferencia_llamada ?? []) {
    bonosAbstract.transferenciaLlamada.push({
      tpvId: 'transferenciaLlamada',
      productKey: `aire_bono:transferenciaLlamada:invoice_lines:${line.id}`,
      description: transferencia_llamada.concepto,
      total: Number(transferencia_llamada.pvp),
    });

    total += Number(transferencia_llamada.pvp);
  }

  for (const cuota_tarifa_libre of data?.cuota_tarifa_libre ?? []) {
    const signals = cuota_tarifa_libre.siglas;
    const signalsInfo = bonosAbstract[signals] ?? [];

    signalsInfo.push({
      tpvId: signals,
      productKey: `aire_bono:${signals}:invoice_lines:${line.id}`,
      description: cuota_tarifa_libre.concepto,
      total: Number(cuota_tarifa_libre.pvp),
    });
    _.set(bonosAbstract, `${signals}`, signalsInfo);

    total += Number(cuota_tarifa_libre.pvp);
  }

  for (const penalizacion_tarifa_basica of data?.penalizacion_tarifa_basica ??
    []) {
    const signals = penalizacion_tarifa_basica.siglas;
    const signalsInfo = bonosAbstract[signals] ?? [];
    signalsInfo.push({
      tpvId: signals,
      productKey: `aire_fee:${signals}:invoice_lines:${line.id}`,
      description: penalizacion_tarifa_basica.concepto,
      total: Number(penalizacion_tarifa_basica.pvp),
    });
    _.set(bonosAbstract, `${signals}`, signalsInfo);

    total += Number(penalizacion_tarifa_basica.pvp);
  }

  return {
    total,
    feeAbstract,
    bonosAbstract,
    consumptionAbstract,
  };
};

/**
 * DO AIRE PETITION.
 */
export const changeHolder = async function (
  sectionRow: GfContractDataCell,
  clientId: number,
  aireFee: AnyModel,
) {
  const client = await GfClient.findByPk(clientId);
  assert(client);
  const hydrated = await hydrate(client);

  await Aire.changeHolder({
    telefono: sectionRow.number!,
    subscriberType: hydrated.subscriberType,
    nif: hydrated.fiscalId,
    tarifa: aireFee.providerFeeId,
  });
};

async function resolveAireLines({
  telefono,
  fiscalId,
  fromAire,
}: {
  telefono: string;
  fiscalId: string;
  fromAire: boolean;
}): Promise<Line[]> {
  if (fromAire) {
    return AireLine.findAll({
      activo: 'SI',
      telefono,
      fiscalId,
    });
  }

  const allLines = await getLineas();
  return allLines.filter(
    (line) =>
      line.activo === 'SI' &&
      line.telefono === telefono &&
      line.fiscalId === fiscalId,
  );
}

export const getBonos = async function (contractId: number, fromAire = false) {
  // Erfan: i've commented this condition because we don't have other cell providers. we only have aire
  // if (!(await GfContractsCellService.isFromAire(contractId))) {
  //   // get local bonos
  //   return GfBonusService.getContractBonos(contractId);
  // }

  const dataCell = await GfContractDataCell.findOne({
    where: { contractId: contractId },
  });
  assert(dataCell);

  if (!dataCell.number) return [];

  const client = await GfClient.findByContractId(contractId);
  assert(client);

  const lines = await resolveAireLines({
    telefono: dataCell.number,
    fiscalId: client.fiscalId,
    fromAire,
  });

  const bonuses = lines
    .map((line) => (Array.isArray(line.bonos) ? line.bonos : []))
    .flat()
    .map((bono) => ({ ...bono, cod: bono.id }));

  return bonuses;
};

/**
 * get list of activity information (in or inOut calls) related to a contract of a client
 * @param {string} number phone number of contract related to a client
 * @param {string} init start time to get activity
 * @param {string} end end time to get activity
 * @param {boolean} inOut get all activity(in phone and out phone) or just in phone
 * @returns {Promise<import('@models').AnyModel[]>} list of activity between two times related to a client
 */
export const getConsumptionLines = async (
  number: number,
  init: string,
  end: string,
  inOut: boolean,
): Promise<AnyModel[]> => {
  let where = {};
  if (inOut) {
    where = {
      [Op.or]: [
        {
          [Op.and]: {
            origen: number,
            serviceType: {
              [Op.ne]: 'MOVIL_ENTRANTE',
            },
          },
        },
        {
          [Op.and]: {
            destino: number,
            serviceType: 'MOVIL_ENTRANTE',
          },
        },
      ],
      fecha: {
        [Op.between]: [init, end],
      },
    };
  } else {
    where = {
      origen: number,
      serviceType: {
        [Op.ne]: 'MOVIL_ENTRANTE',
      },
      fecha: {
        [Op.between]: [init, end],
      },
    };
  }

  return GfAireCdr2.findAll({
    where,
    //@ts-ignore
    distinct: true,
    order: [['fecha', 'asc']],
  });
};

/**
 * set bono by internal ID
 */
export const setAireBono = async (contractId: number, bonoId: string) => {
  const dataCell = await GfContractDataCell.findByContractId(contractId);
  assert(dataCell, `No dataCell found for contractId: ${contractId}`);

  await Aire.setAdditionalBonuses({
    telefono: dataCell.number!,
    bonos: [{ [String(bonoId).substring(0, 1)]: [bonoId] }],
  });
};
