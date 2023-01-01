// @ts-check
'use strict';
const { GfContract, GfContractDataCell, GfAireCdr2 } =
  require('@models').intranet;

const { Op } = require('sequelize');

const moment = require('moment');
const _ = require('lodash');

const CellFacade = require('./FacadeCell');
const CounterService = require('../global/CounterService');
const { AireCdr } = require('./AireService');
const to = require('await-to-js').default;

exports.getConsumptionLines = async (
  contractId,
  clientId,
  init,
  end,
  inOut,
) => {
  const contract = await GfContract.findByPk(contractId);
  if (!contract) {
    return {
      success: false,
      reason: 'No contract found',
    };
  }

  if (contract.clientId !== clientId) {
    return {
      success: false,
      reason: 'This contract is not from this client',
    };
  }

  const section = await GfContractDataCell.findOne({
    where: {
      contractId,
    },
  });
  if (!_.get(section, 'number', null)) {
    return {
      success: false,
      reason: 'This contract has no number associated',
    };
  }

  if (!init || !end || !moment(init).isValid() || !moment(end).isValid()) {
    return {
      success: false,
      reason: 'Malformed dates',
    };
  }

  if (moment(init).isAfter(moment(end))) {
    return {
      success: false,
      reason: 'initDate must be lower than endDate',
    };
  }

  const lines = await CellFacade.getConsumptionLines(
    section.number,
    init,
    end,
    inOut,
  );
  return {
    success: true,
    data: lines,
  };
};

/**
 *
 * @param {import('@models').AnyModel[]} contracts
 * @param {*} init
 * @param {*} end
 * @param {*} inOut
 * @returns
 */
exports.getConsumptionLinesForMultipleContracts = async (
  contracts,
  init,
  end,
  inOut,
) => {
  const contractIds = contracts.map((c) => c.id);
  const historyResults = await Promise.all(
    contracts.map((c) =>
      CellFacade.getConsumptionLines(c.dataCell.number, init, end, inOut),
    ),
  );

  return {
    success: true,
    data: Object.fromEntries(_.zip(contractIds, historyResults)),
  };
};

exports.importDate = async (aireCdrStatus, date) => {
  // get different between now and date that we want to import
  const days = moment(date)
    .startOf('day')
    .diff(moment().startOf('day'), 'days');

  //import last n days data
  return await exports.importYesterday(aireCdrStatus, days);
};

/**
 *
 * @param {import('moment').Moment} date
 */

const splitDate = (date) => ({
  mes: date.format('MM'),
  anyo: date.format('YYYY'),
  dia: date.format('DD'),
});

const PAGE_SIZE = 10000;
/**
 * @type {import('@delinternet/sdk-aire'][]}
 */
const types = ['MOVIL', 'MOVIL_ENTRANTE', 'SMS', 'DATOS'];

exports.importYesterday = async (aireCdrStatus, days = 1) => {
  //get date that we want to import cdr data(by default is 1 that means yesterday)
  const date = moment().add(days, 'days');
  const date_string = date.format('YYYY-MM-DD');
  const splittedDate = splitDate(date);
  const counterKey = `AireCdrManagerImport_${date_string}`;
  //global counter for progress bar
  await CounterService.create(counterKey, {
    max: 10,
    init: 0,
    model_id: aireCdrStatus.id,
    model_name: 'gf_aire_cdr_status',
  });

  // delete imported cdr in selected date
  await deleteImportedCdrByDate(date_string);
  await CounterService.tick(counterKey);
  // get data from aire api then paginate them and normilze data then insert to database
  let tt = 0;
  const audit = {};
  const totals = JSON.parse(aireCdrStatus.totals);

  /**
   *
   * @param {import('@delinternet/sdk-aire']} type
   * @returns
   */
  async function processType(type) {
    const [error, total] = await to(
      AireCdr.count({
        tipo_servicio: type,
        ...splittedDate,
      }),
    );

    if (error) {
      console.error(error);
      await CounterService.tick(counterKey);
      await CounterService.tick(counterKey);
      return;
    }

    tt += total;
    await CounterService.tick(counterKey);

    const nPages = Math.ceil(total / PAGE_SIZE);
    _.set(audit, `${type}.total`, 0);
    _.set(totals, `aire.${type}.totalRows`, total);

    for (let n = 1; n < nPages + 1; n++) {
      const { rows } = await AireCdr.paginated(
        { page: n, pageSize: PAGE_SIZE },
        {
          tipo_servicio: type,
          ...splittedDate,
        },
      );

      for (const element of rows) {
        //calculate total seconds
        const seconds = Number(_.get(totals, `aire.${type}.segundos`, 0));
        _.set(
          totals,
          `aire.${type}.segundos`,
          seconds + Number(element.segundos),
        );

        //calculate total import
        const importe = Number(_.get(totals, `aire.${type}.importe`, 0));
        _.set(
          totals,
          `aire.${type}.importe`,
          importe + Number(element.importe),
        );
      }

      //calculate total element of each type
      const auditTotal = _.get(audit, `${type}.total`, 0);
      _.set(audit, `${type}.total`, auditTotal + rows.length);

      await GfAireCdr2.bulkCreate(
        generateAireCdrRow(rows, type, date.format('YYYY-MM-DD')),
      );
    }

    await CounterService.tick(counterKey);
  }

  await Promise.all(types.map(processType));
  await CounterService.tick(counterKey);
  aireCdrStatus.totals = JSON.stringify(totals);
  aireCdrStatus.countedAireRecords = tt;
  aireCdrStatus.state = 'done';
  await aireCdrStatus.save();
  return {
    aireCdrStatus,
  };
};

/**
 * delete imported cdr by date
 * @param {string} date date that we want to delete
 */
const deleteImportedCdrByDate = async (date) => {
  await GfAireCdr2.destroy({
    where: {
      date,
      [Op.or]: [
        {
          serviceType: ['MOVIL', 'MOVIL_ENTRANTE', 'SMS'],
          descripcion: {
            [Op.notLike]: '%(L) %',
          },
        },
        {
          serviceType: 'DATOS',
          [Op.or]: [
            {
              descripcion: {
                [Op.eq]: null,
              },
            },
            {
              descripcion: '',
            },
          ],
        },
      ],
    },
  });
};

/**
 * get data from aire api and normilize date to insert in database
 * @param {Array} results array of objects that response form aire api
 * @param {string} type ["MOVIL", "MOVIL_ENTRANTE", "SMS", "DATOS"]
 * @param {string} date date of cdrs
 * @returns {Array}
 */
const generateAireCdrRow = (results, type, date) => {
  const cdrRows = [];
  for (const result of results) {
    const _fecha = result.fecha.split(' ');
    const parts = _fecha[0].split('/');
    const fecha = `20${parts[2]}-${parts[1]}-${parts[0]} ${_fecha[1]}`;
    cdrRows.push({
      date,
      serviceType: type,
      fecha,
      segundos: result.segundos,
      importe: result.importe.replace(',', '.'),
      origen: result.origen,
      destino: result.destino,
      descripcion: result.descripcion,
    });
  }
  return cdrRows;
};
