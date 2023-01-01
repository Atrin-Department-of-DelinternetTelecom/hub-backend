//@ts-check
'use strict';
const {
  GfKamailioUnifiedCdr,
  GfKamailioHistoricEdge,
  GfInvoicePeriod,
  GfContract,
  GfClient,
  GfFixCallTypes,
  GfContractDataFix,
  GfBonosFixValues,
  GfBonusContractXref,
  GfFeesFixValue,
} = require('@models').intranet;

const { getAllEntities } = require('@utils/request-handler');

const { respondSuccess, respondNotFound } = require('@utils/response');

const moment = require('moment');

const _ = require('lodash');

const {
  findNumber,
  cleanNumber,
} = require('./FixCDR_GfPhoneNumberPrefixService');

const actionRunner = require('@lib/action-runner').default;

const { getActualConditions } = require('./Fee/GfFeeService');

const { Op } = require('sequelize');

const { Redis } = require('@lib/cache');

const CounterService = require('../global/CounterService');

/**
 * @type {Promise<unknown>}
 */
let _numbersPromise = null;

/**
 * get fix cdr information (activity of fix) related to selected contract in selected period
 * @param {number} contractId get fix information of selected contract
 * @param {number} periodId get fix information of which period (if null means last period)
 * @return {object} contain cdr information, total and begin and date of period
 */
exports.getFromContractId = async (contractId, periodId = null) => {
  //get contract
  const contract = await GfContract.findByPk(contractId);
  if (!contract) {
    return respondNotFound(`contract with id ${contractId} not found`);
  }
  const client = await GfClient.findByPk(contract.clientId);

  // get period
  let period = null;
  if (!periodId) {
    period = await GfInvoicePeriod.findOne({
      order: [['creationDate', 'desc']],
    });
  } else {
    period = await GfInvoicePeriod.findByPk(periodId);
  }

  if (!period) {
    return respondNotFound(`period with id ${periodId} not found`);
  }
  periodId = period.id;

  const ret = {};
  let edges = JSON.parse(
    (
      await GfKamailioHistoricEdge.findOne({
        where: {
          periodId,
          contractId,
        },
      })
    )?.edges ?? '{}',
  );
  ret.edges = edges;

  const cdr = await GfKamailioUnifiedCdr.findAll({
    where: {
      contractId,
      periodId,
    },
  });
  ret.cdr = cdr;

  const initialEdges = ret.edges?.initial ?? {};
  const edgeMinutes = ret.edges?.end ?? {};

  for (const key in initialEdges) {
    const init = initialEdges[key];
    initialEdges[key] = {
      initial: init,
      used: init - edgeMinutes[key],
    };
  }
  ret.edges = initialEdges;
  ret.contract = contract;
  ret.client = client;

  edges = ret.edges;
  ret.edges = [];

  const fixCallTypes = {};
  (
    await GfFixCallTypes.findAll({
      where: {
        id: Object.keys(edges),
      },
    })
  ).forEach((fixCallType) => {
    fixCallTypes[fixCallType.id] = fixCallType;
  });

  for (const fixCallTypeId in edges) {
    ret.edges.push({
      type: fixCallTypes[fixCallTypeId],
      minutes: {
        used: parseFloat(edges[fixCallTypeId].used).toFixed(2),
        initial: parseFloat(edges[fixCallTypeId].initial).toFixed(2),
      },
    });
  }

  let total = 0.0;
  for (const [key, cdrRow] of Object.entries(ret.cdr)) {
    total += parseFloat(cdrRow.userCharge);
    ret.cdr[key].cost = parseFloat(_.get(ret.cdr, `${key}.cost`, 0)).toFixed(4);
    ret.cdr[key].finalPrice = parseFloat(
      _.get(ret.cdr, `${key}.finalPrice`, 0),
    ).toFixed(4);
    ret.cdr[key].userCharge = parseFloat(
      _.get(ret.cdr, `${key}.userCharge`, 0),
    ).toFixed(4);
  }

  ret.total = Number(total).toFixed(2);
  ret.dateBegin = moment(period.period).startOf('month').format('YYYY-MM-DD');
  ret.dateEnd = moment(period.period)
    .endOf('month')
    .format('YYYY-MM-DD 23:59:59');

  return respondSuccess(ret);
};

/**
 * Your GET endpoint
 * get all FeeGroup labels(information) record
 *
 * returns Object
 **/
exports.getFixCdrs = async function (query) {
  return await getAllEntities(query, GfKamailioUnifiedCdr);
};

const invalidNumbers = {};

/**
 * get call object and calculate price and attach addition information (contractId,type and ...)
 * @param {object} call information aobut call (from,to,duration)
 * @returns {Promise<any>} attached additional calculated info to call
 */
exports.parseSingleCall = async (call) => {
  const numbers = await exports.getNumbers();
  const type = await findNumber(call.to);
  let _type = null;
  if (!type.success) {
    _type = 'UNK';
  } else {
    _type = _.get(type, 'groupCallType.kamailioRef', type.type);
  }

  const cleanFrom = cleanNumber(call.from);
  const cleanTo = cleanNumber(call.to);

  let cId = _.get(
    numbers,
    `${cleanFrom}.contractId`,
    _.get(numbers, `${cleanTo}.contractId`, 0),
  );

  if (!cId) {
    //get list of contracts should be belongs to this unifiedCdr by {cleanFrom} or {cleanTo} and save it to cache
    let contracts = await getContractsByPhoneNumberForInvalidCdrs(cleanFrom);
    invalidNumbers[cleanFrom] = contracts;
    if (!contracts.length) {
      contracts = await getContractsByPhoneNumberForInvalidCdrs(cleanTo);
      invalidNumbers[cleanTo] = contracts;
    }

    //check wich one shoulde be belongs to this contract by active and deactive date of contracts
    const selectedContract = selectActivedContract(contracts, call.date);

    //set cId by selected valid contract
    cId = selectedContract?.id ?? null;
  }

  let pvp = null;
  switch (_.get(type, 'primaryCallType.priceType', 'default')) {
    case 'byCost':
      pvp = parseFloat(call.cost) * parseFloat(type.primaryCallType.priceValue);
      break;
    case 'byMinutes':
      pvp =
        (parseFloat(call.seconds) / 60.0) *
        parseFloat(type.primaryCallType.priceValue);
      break;
    default:
      pvp = call.cost;
      break;
  }

  call.contractId = cId;
  call.groupIds = type.groupIds?.join(',') ?? undefined;
  call.callType = _type;
  call.finalPrice = pvp;
  call.description = type.finalRate?.description ?? undefined;
  return call;
};

/**
 * get contracts by their numbers
 * @param {string} number phone number to find contract
 * @returns {Promise<object[]>}
 */
const getContractsByPhoneNumberForInvalidCdrs = async (number) => {
  //read from cache
  if (invalidNumbers[number]) invalidNumbers[number];

  return GfContract.findAll({
    where: {
      '$dataFix.number$': number,
    },
    include: { model: GfContractDataFix, as: 'dataFix' },
  });
};

/**
 * get list of contracts and activity time and select valid time
 * @param {object[]} contracts list of contracts to find valid contract
 * @param {string} cdrDate date of cdr (call time)
 * @returns {Promise<object|null>} get valid contract or null(no valid contract in list)
 */
const selectActivedContract = (contracts, cdrDate) => {
  const startDate = moment(cdrDate).startOf('months');
  const endDate = moment(cdrDate).endOf('months');
  cdrDate = moment(cdrDate);
  for (const contract of contracts) {
    const { boundedStart, boundedEnd } = getStartAndEndOfContractInThisMonth(
      contract,
      startDate,
      endDate,
    );
    if (cdrDate.isBetween(boundedStart, boundedEnd)) {
      return contract;
    }
  }
  return null;
};

/**
 * find minimum period between start and end of bounding from input and activation and deactivation from contract
 * @param {object} contract contract activation and deactivation info
 * @param {moment} startDate min value for bounding
 * @param {moment} endDate max value for bounding
 * @returns {Promise<{boundedStart:moment,endBound:moment}>}
 */
const getStartAndEndOfContractInThisMonth = (contract, startDate, endDate) => {
  if (
    contract.dateDeactivation &&
    endDate.isAfter(moment(contract.dateDeactivation).startOf('day'))
  ) {
    endDate = moment(contract.dateDeactivation);
  }

  if (
    contract.dateActivation &&
    startDate.isBefore(moment(contract.dateActivation))
  ) {
    startDate = moment(contract.dateActivation);
  }

  return { boundedStart: startDate, boundedEnd: endDate };
};

/**
 * get data fix informations of all contracts from global or generate
 * @returns {object}
 */
exports.getNumbers = () => {
  if (_numbersPromise) return _numbersPromise;
  _numbersPromise = exports.generateNumbers();
  return _numbersPromise;
};

/**
 * generate numbers used for update cache on after update or create GfContractDataFix entity and inside getNumbers function
 * @returns {Promise<any>}
 */
exports.generateNumbers = async () => {
  const numbers = {};
  const dataFixs = await GfContractDataFix.findAll({
    include: {
      model: GfContract,
      as: 'contract',
      where: {
        state: 'active',
      },
    },
  });

  for (const dataFix of dataFixs) {
    numbers[dataFix.number.trim()] = dataFix;
  }

  return numbers;
};

/**
 * set edges (start invoicing in preparative) for fix contracts
 * @param {Object} gfInvoicePeriod information of period
 * @param {number} creator_id id of user that started this action
 */
exports.setEdgesByTandas = async (gfInvoicePeriod, creator_id) => {
  if (gfInvoicePeriod.fixCdrEdgesDone === 'in_progress') {
    respondSuccess({
      code: 'request_in_process',
      message: `this period is ${gfInvoicePeriod.fixCdrEdgesDone}.`,
    });
  }

  const startOfPeriod = moment(gfInvoicePeriod.period)
    .subtract(1, 'month')
    .startOf('month')
    .format('YYYY-MM-DD 00:00:00');
  const endOfPeriod = moment(gfInvoicePeriod.period)
    .subtract(1, 'month')
    .endOf('month')
    .format('YYYY-MM-DD 23:59:59');

  //get all contract that has some activity in this month(imported by fix cdr)
  const contractIds = [];
  (
    await GfKamailioUnifiedCdr.findAll({
      where: {
        date: {
          [Op.between]: [startOfPeriod, endOfPeriod],
        },
        contractId: {
          [Op.gt]: 0,
        },
      },
      attributes: ['contractId'],
      group: 'contractId',
    })
  ).forEach((unifiedCdr) => {
    contractIds.push(unifiedCdr.contractId);
  });

  //remove previos seted data
  await GfKamailioHistoricEdge.destroy({
    where: {
      periodId: gfInvoicePeriod.id,
    },
  });

  const tanda = Math.ceil(contractIds.length / 50);
  await CounterService.create(`Invoice_FixEdges_${gfInvoicePeriod.id}`, {
    max: tanda ? tanda : 1,
  });

  if (contractIds.length === 0) {
    await CounterService.tick(`Invoice_FixEdges_${gfInvoicePeriod.id}`);
    gfInvoicePeriod.fixCdrEdgesDone = 'done';
    await gfInvoicePeriod.save();
    return respondSuccess({ code: 'request_done' });
  }

  gfInvoicePeriod.fixCdrEdgesDone = 'in_progress';
  await gfInvoicePeriod.save();

  //put related data on redis
  await putStaticDataNeededInSetEdgesToRedis();

  //add action
  const actions = [];
  for (const chunk of _.chunk(contractIds, 50)) {
    const n = actions.length;

    await Redis.forever(`fix_edge_contract_ids_${n}`, JSON.stringify(chunk));

    //add task as worker to parse data
    actions.push({
      name: 'set-edges-fix',
      params: {
        periodId: gfInvoicePeriod.id,
        tandas: n,
      },
    });
  }

  const { id: bulkId } = await actionRunner.createBulk(
    {
      creator_id: creator_id,
      name: 'set-edges-fix',
      model_name: 'gf_invoice_periods:setEdgesFix',
      model_id: gfInvoicePeriod.id,
    },
    actions,
  );

  return respondSuccess({
    code: 'request_started',
    message: 'factor fix cdrs started',
  });
};

/**
 * put fix call types,primary types and bonos
 */
const putStaticDataNeededInSetEdgesToRedis = async () => {
  // attach types
  const types = {};
  (await GfFixCallTypes.findAll()).forEach((fixCallType) => {
    types[fixCallType.id] = fixCallType;
  });
  await Redis.forever(`types`, JSON.stringify(types));

  //attach primary types
  const primaryTypes = {};
  (
    await GfFixCallTypes.findAll({
      where: {
        primary: 1,
      },
    })
  ).forEach((fixCallType) => {
    primaryTypes[fixCallType.kamailioRef] = fixCallType;
  });
  await Redis.forever(`primary_types`, JSON.stringify(primaryTypes));

  //bono
  const bonos_values = {};
  for (const bonoFixValue of await GfBonosFixValues.findAll()) {
    const bonoIdValues = _.get(bonos_values, bonoFixValue.bonoId, []);
    bonoIdValues.push(bonoFixValue);
    _.set(bonos_values, bonoFixValue.bonoId, bonoIdValues);
  }

  await Redis.forever(`bonos_values`, JSON.stringify(bonos_values));
};

/**
 * delete all additional data on cache after finish process
 */
exports.removeStaticDataNeededInSetEdgesFromRedis = async (periodId) => {
  await Redis.forget('types');
  await Redis.forget('primary_types');
  await Redis.forget('bonos_values');
};

/**
 * caclulate total minutes and price based on call history and update or inset to GfKamailioHistoricEdge table
 * @param {number} periodId set operation on which period
 * @param {number|null} contractId set edge for which single contract or null for group of contract
 * @param {boolean} simulation is this operation for simulation of real
 * @param {number} tanda select which group of contract from redis
 * @returns {Promise<{
 *  success:boolean,
 *  edges?: {
 *   initial: any,
 *   end: any,
 *  },
 *  cdr?: any
 *  lost?: any[]
 * } | {
 *  success: false,
 *  reason: string
 * }>} based on simulation parameter
 */
exports.setEdges = async (
  periodId,
  contractId = null,
  simulation = false,
  tanda = null,
) => {
  //simulation work for just single contract
  if (simulation && !(contractId > 0)) {
    return {
      success: false,
      reason: 'Simulation not permited if no contract selected',
    };
  }

  let types = await Redis.get('types');
  let primary_types = await Redis.get('primary_types');
  let bonos_values = await Redis.get('bonos_values');

  if (!types || !primary_types || !bonos_values) {
    throw new Error('can not found required data from redis');
  }

  types = JSON.parse(types);
  primary_types = JSON.parse(primary_types);
  bonos_values = JSON.parse(bonos_values);

  // get contract ids based on tandas from redis
  let contractIds = JSON.parse(
    await Redis.pull(`fix_edge_contract_ids_${tanda}`),
  );

  //get period information
  const period = await GfInvoicePeriod.findByPk(periodId);

  //calculate begin and end time based on period to get call history(unified cdr)
  const dateBegin = moment(period.period)
    .subtract(1, 'month')
    .startOf('month')
    .format('YYYY-MM-DD');
  const dateEnd = moment(period.period)
    .subtract(1, 'months')
    .endOf('month')
    .format('YYYY-MM-DD 23:59:59');

  //if contract id setted, it means we want to calculate for single contract
  if (contractId) {
    contractIds = [contractId];
  }

  //get all contract information
  const contracts = await GfContract.findAll({
    where: {
      id: contractIds,
    },
  });

  //calculate lost contract
  const lost = [];
  if (contracts.length !== contractIds.length) {
    for (const contract of contracts) {
      if (!contractIds.includes(contract.id)) {
        lost.push(contract.id);
      }
    }
  }

  //get all available contract bonos related to contractIds and map them to use in related contract(inside for loop)
  const AllCBonos = {};
  for (const bonusContract of await GfBonusContractXref.findAll({
    where: {
      contractId: contractIds,
    },
  })) {
    const cBonos = _.get(AllCBonos, bonusContract.contractId, []);
    cBonos.push(bonusContract);
    _.set(AllCBonos, bonusContract.contractId, cBonos);
  }

  //calculate fixs based on contract in selected period
  const simCdr = [];
  let initialEdges;
  let edgeMinutes = {};
  const updateCall = [];
  for (const contract of contracts) {
    const cBonos = AllCBonos[contract.id] ? AllCBonos[contract.id] : [];
    const conditions = await getActualConditions(contract.feeGroupId);
    const fixValues = await GfFeesFixValue.findAll({
      where: {
        feeId: conditions.id,
      },
    });

    //calculate minutes (get total capacity)
    edgeMinutes = {};
    for (const fv of fixValues) {
      const kType = types[fv.fixTypeId].id;
      edgeMinutes[kType] = parseFloat(fv.minutes);
    }

    //add bono (additional minutes to total capacity)
    for (const cBono of cBonos) {
      const bonoValues = bonos_values[cBono.bonoId]
        ? bonos_values[cBono.bonoId]
        : [];
      for (const bonoValue of bonoValues) {
        const kType = types[bonoValue.fixTypeId].id;
        const minutes = _.get(edgeMinutes, kType.toString(), 0.0);
        _.set(
          edgeMinutes,
          kType.toString(),
          minutes + parseFloat(bonoValue.minutes),
        );
      }
    }

    initialEdges = { ...edgeMinutes };

    // get all history of this contract between begin and end date
    const calls = await GfKamailioUnifiedCdr.findAll({
      where: {
        date: {
          [Op.between]: [dateBegin, dateEnd],
        },
        contractId: contract.id,
      },
    });

    for (const call of calls) {
      let groupIds = [];
      if (call.groupIds) {
        groupIds = call.grouptIds.split(',');
      }

      const primaryId = primary_types[call.callType]?.id ?? 0;
      const minutes = parseFloat(call.seconds) / 60;
      const ret = _selectEdge(edgeMinutes, minutes, groupIds, primaryId);
      edgeMinutes = ret.edgeMinutes;
      const userCharge = (call.finalPrice / 100) * ret.percentage;

      if (simulation) {
        simCdr.push(call);
      } else if (call.periodId !== periodId && call.userCharge !== userCharge) {
        call.userCharge = userCharge;
        call.periodId = periodId;
        updateCall.push({
          id: call.id,
          userCharge,
          periodId,
        });
      }
    }

    if (!simulation) {
      const row = await GfKamailioHistoricEdge.findOne({
        where: {
          periodId,
          contractId: contract.id,
        },
      });

      if (row) {
        row.edges = JSON.stringify({
          initial: convertToFloatObject(initialEdges),
          end: convertToFloatObject(edgeMinutes),
        });
        await row.save();
      } else {
        const section = await GfContractDataFix.findOne({
          where: {
            contractId: contract.id,
          },
        });

        await GfKamailioHistoricEdge.create({
          edges: JSON.stringify({
            initial: convertToFloatObject(initialEdges),
            end: convertToFloatObject(edgeMinutes),
          }),
          periodId,
          contractId: contract.id,
          number: section.number,
          month: moment(period.period)
            .subtract(1, 'months')
            .startOf('month')
            .format('YYYYMM'),
        });
      }
    }
  }

  //update all call instance
  await GfKamailioUnifiedCdr.bulkCreate(updateCall, {
    updateOnDuplicate: ['userCharge', 'periodId', 'updateDate'],
  });

  //return value based on simulation
  if (simulation) {
    return {
      success: true,
      edges: {
        initial: initialEdges,
        end: edgeMinutes,
      },
      cdr: simCdr,
    };
  }
  return {
    success: true,
    lost,
  };
};

/**
 * subtract minutes taked(call history) from original edge minutes
 * @param {object} edgeMinutes taked minutes by groupIds
 * @param {number} minutes time taked in each call history
 * @param {number[]} groupIds if of groups
 * @param {number} primaryId main id (owner of call)
 * @returns {{edgeMinutes:object,percentage:number}}
 */
const _selectEdge = (edgeMinutes, minutes, groupIds, primaryId) => {
  const originalMinutes = minutes;
  for (const gId of groupIds) {
    if (edgeMinutes[gId]) {
      const edge = isNaN(_.get(edgeMinutes, edgeMinutes[gId], 0))
        ? 0
        : _.get(edgeMinutes, edgeMinutes[gId], 0.0);
      edgeMinutes[gId] = edge;
      const toSubs = edge >= minutes ? minutes : edge;
      edgeMinutes[gId] -= toSubs;
      minutes -= toSubs;
      if (!(minutes > 0)) {
        break;
      }
    }
  }

  if (minutes > 0) {
    const edge = isNaN(_.get(edgeMinutes, primaryId, 0.0))
      ? 0
      : _.get(edgeMinutes, primaryId, 0.0);
    edgeMinutes[primaryId] = edge;
    const toSubs = edge >= minutes ? minutes : edge;
    edgeMinutes[primaryId] -= toSubs;
    minutes -= toSubs;
  }

  const percentage = minutes ? (minutes * 100) / originalMinutes : 0;
  return {
    edgeMinutes,
    percentage,
  };
};

const convertToFloatObject = (obj) => {
  for (const key in obj) {
    obj[key] = parseFloat(obj[key]).toString();
  }
  return obj;
};
