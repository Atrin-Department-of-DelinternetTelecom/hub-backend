'use strict';

const {
  GfClient,
  GfFeeGroup,
  GfBonus,
  GfDiscountsMatrix,
  GfContractHolderChange,
  GfSection,
  GfContractDataCell,
  GfContractDataFix,
  GfContractDataInternet,
  GfContractSectionStatus,
  GfContract,
  GfDiscountsScheduled,
  GfUser,
  sequelize,
} = require('@models').intranet;

const _ = require('lodash');

const { Op } = require('sequelize');

const moment = require('moment');

const Invoice_GfPointerService = require(`./Invoice_GfPointerService`);
const { generateIlines } = require(`./GfInvoiceService`);
const { hydrateContract } = require('./GfContractService');
const { daysBetweenTwoDates } = require('../../utils/dates');
const { respondSuccess, respondNotFound } = require('@utils/response');

exports.getFrontNextMonthAbstract = async (clientId, userId) => {
  const client = await GfClient.findByPk(clientId);
  if (!client) {
    return respondNotFound(`client with id ${clientId} not found.`);
  }

  const contractIds = await _getInvolvedContracts(clientId);
  const results = [];
  for (const contractId in contractIds) {
    // getNextMonthAbstract always will rollback the transaction, so we need to handle its error manually
    let ret;
    try {
      await sequelize.transaction(async (t) => {
        const contract = contractIds[contractId].contract;
        ret = await exports.getNextMonthAbstract(contract, clientId, t, userId);
        ret.contract = contract;
        if (ret.success) {
          ret.client = client;
          ret.contract = await hydrateContract(contract, true);
          const days = daysBetweenTwoDates(
            ret.abstract.period.initDate,
            ret.abstract.period.endDate,
          );
          ret.abstract.period.days = days;
          const stepPercent = 100 / days;
          ret.abstract.stepPercentage = stepPercent;
          const qunt = Math.floor(days / 5);
          ret.abstract.period.steps = [];
          for (let n = 0; n < days; n++) {
            ret.abstract.period.steps.push({
              label:
                n === 0 || n === days - 1 || n / qunt === Math.floor(n / qunt)
                  ? moment(ret.abstract.period.initDate)
                      .add(n, 'days')
                      .format('DD/MM')
                  : '',
            });
          }
          const startDate = ret.abstract.period.initDate;
          for (const feeGroupId in ret.abstract.fees) {
            const feeGroup = await GfFeeGroup.findByPk(feeGroupId);
            for (const k in ret.abstract.fees[feeGroupId]) {
              const part = ret.abstract.fees[feeGroupId][k];
              const end = part.end ? part.end : ret.abstract.period.endDate;
              ret.abstract.fees[feeGroupId][k]._left =
                daysBetweenTwoDates(startDate, part.init) * stepPercent;
              ret.abstract.fees[feeGroupId][k]._width =
                daysBetweenTwoDates(part.init, end) * stepPercent;
              ret.abstract.fees[feeGroupId][k]._name = feeGroup.name;
              ret.abstract.fees[feeGroupId][k]._initLabel = moment(
                part.init,
              ).format('DD/MM HH:mm');
              ret.abstract.fees[feeGroupId][k].init = moment(part.init).format(
                'YYYY-MM-DD HH:mm:ss',
              );
              ret.abstract.fees[feeGroupId][k]._endLabel = moment(
                part.end,
              ).format('DD/MM HH:mm');
              ret.abstract.fees[feeGroupId][k].end = moment(part.end).format(
                'YYYY-MM-DD HH:mm:ss',
              );
              ret.abstract.fees[feeGroupId][k]._id = part._id;
              ret.abstract.fees[feeGroupId][k].color = '#304ffe';
            }
          }

          for (const bonoId in ret.abstract.bonos) {
            const bono = await GfBonus.findByPk(bonoId);
            for (const k in ret.abstract.bonos[bonoId]) {
              const part = ret.abstract.bonos[bonoId][k];
              const xrefId = k.replace('xref-', '');
              for (const kk in part) {
                const part2 = part[kk];
                const end = part2.end ? part2.end : ret.abstract.period.endDate;
                ret.abstract.bonos[bonoId][k][kk]._left =
                  daysBetweenTwoDates(startDate, part2.init) * stepPercent;
                ret.abstract.bonos[bonoId][k][kk]._width =
                  daysBetweenTwoDates(part2.init, end) * stepPercent;
                ret.abstract.bonos[bonoId][k][kk]._name = bono.name;
                ret.abstract.bonos[bonoId][k][kk]._initLabel = moment(
                  part2.init,
                ).format('DD/MM HH:mm');
                ret.abstract.bonos[bonoId][k][kk].init = moment(
                  part2.init,
                ).format('YYYY-MM-DD HH:mm:ss');
                ret.abstract.bonos[bonoId][k][kk]._endLabel = moment(
                  part2.end,
                ).format('DD/MM HH:mm');
                ret.abstract.bonos[bonoId][k][kk].end = moment(
                  part2.end,
                ).format('YYYY-MM-DD HH:mm:ss');
                ret.abstract.bonos[bonoId][k][kk]._id = xrefId;
                ret.abstract.bonos[bonoId][k][kk].color = '#FFEE58';
              }
            }
          }

          for (const k in ret.abstract.discountsExecuted) {
            const exec = ret.abstract.discountsExecuted[k];
            const matrix = await GfDiscountsMatrix.findByPk(exec.matrixId);
            let execInit = '';
            if (moment(exec.init).isBefore(moment(startDate))) {
              execInit = startDate;
            } else {
              execInit = exec.init;
            }

            const end = exec.end ? exec.end : ret.abstract.period.endDate;
            ret.abstract.discountsExecuted[k]._left =
              daysBetweenTwoDates(startDate, execInit) * stepPercent;
            ret.abstract.discountsExecuted[k]._width =
              daysBetweenTwoDates(execInit, end) * stepPercent;
            ret.abstract.discountsExecuted[k]._name = matrix.alias;
            ret.abstract.discountsExecuted[k]._initLabel = moment(
              exec.init,
            ).format('DD/MM HH:mm');
            ret.abstract.discountsExecuted[k].init = moment(exec.init).format(
              'YYYY-MM-DD HH:mm:ss',
            );
            ret.abstract.discountsExecuted[k]._endLabel = moment(
              exec.end,
            ).format('DD/MM HH:mm');
            ret.abstract.discountsExecuted[k].end = moment(exec.end).format(
              'YYYY-MM-DD HH:mm:ss',
            );
            ret.abstract.discountsExecuted[k]._id = exec.executedId;
            ret.abstract.discountsExecuted[k].color = '#4caf50';
          }

          for (const clientId in ret.abstract.holders) {
            const blocks = ret.abstract.holders[clientId];
            const _client = await GfClient.findByPk(clientId);
            for (const k in blocks) {
              const bl = blocks[k];
              ret.abstract.holders[clientId][k]._left =
                daysBetweenTwoDates(startDate, bl.init) * stepPercent;
              ret.abstract.holders[clientId][k]._width =
                daysBetweenTwoDates(bl.init, bl.end) * stepPercent;
              ret.abstract.holders[clientId][k]._name = _client.name;
              ret.abstract.holders[clientId][k].init = moment(bl.init).format(
                'YYYY-MM-DD HH:mm:ss',
              );
              ret.abstract.holders[clientId][k]._initLabel = moment(
                bl.init,
              ).format('DD/MM HH:mm');
              ret.abstract.holders[clientId][k].end = moment(bl.end).format(
                'YYYY-MM-DD HH:mm:ss',
              );
              ret.abstract.holders[clientId][k]._endLabel = moment(
                bl.end,
              ).format('DD/MM HH:mm');
              ret.abstract.holders[clientId][k]._id = bl._id;
              ret.abstract.holders[clientId][k].color = '#f57c00';
            }
          }

          for (const k in ret.abstract.blocked) {
            const block = ret.abstract.blocked[k];
            const end =
              block.end !== '2500-01-01 00:00:00'
                ? block.end
                : ret.abstract.period.endDate;
            ret.abstract.blocked[k]._left =
              daysBetweenTwoDates(startDate, block.init) * stepPercent;
            ret.abstract.blocked[k]._width =
              daysBetweenTwoDates(block.init, end) * stepPercent;
            ret.abstract.blocked[k]._name = 'UNPAID';
            ret.abstract.blocked[k]._initLabel = block.init;
            ret.abstract.blocked[k]._id = block._id;
            ret.abstract.blocked[k].color = '#c62828';
          }
        } else {
          ret.abstract = {
            contractId,
            clientId,
            period: {
              initDate: null,
              endDate: null,
            },
            invoiceLinesIds: [],
            fees: [],
            bonos: [],
            holders: [],
            blocked: [],
            discountsExecuted: [],
            extraProcess: [],
          };
          ret.lines = [];
        }
        results.push(ret);
      });
      // eslint-disable-next-line no-empty
    } catch {}
  }

  return respondSuccess({
    success: true,
    contracts: results,
  });
};

exports.getNextMonthAbstract = async (contract, clientId, t, userId) => {
  const mustHave = await Invoice_GfPointerService.getPeriodPointer(
    contract,
    false,
    true,
  );

  const client = await GfClient.findByPk(clientId);
  const ret = await generateIlines(
    mustHave.period,
    contract,
    client,
    null,
    userId,
  );

  // if (IS_TEST !== true){
  //     $ado->rollBack();
  // }
  await t.rollback();

  if (!ret.success) {
    return ret;
  }

  return {
    success: true,
    abstract: ret.abstract,
    lines: ret.lines,
  };
};

const contractRelatedInfo = [
  {
    model: GfFeeGroup,
    as: 'fee_group',
    include: {
      model: GfSection,
      as: 'sections',
      required: false,
    },
    required: false,
  },
  {
    model: GfContractDataCell,
    as: 'dataCell',
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
    model: GfBonus,
    as: 'bonuses',
    required: false,
  },
  {
    model: GfDiscountsScheduled,
    as: 'discounts',
    required: false,
    attributes: ['contractId'],
  },
  {
    model: GfUser,
    as: 'seller',
    required: false,
    attributes: ['id', 'userId', 'name'],
  },
];

/**
 * @param {number} clientId id of client to get contract information
 *  including actual or changed
 * @return {Promise<any[]>} array of object
 */
const _getInvolvedContracts = async (clientId) => {
  const contractIds = {};

  // list of past contract ids
  const pastContracts = await GfContractHolderChange.findAll({
    where: {
      fromClientId: clientId,
    },
  });
  const pastContractIdsIndexedByContractIds = _.groupBy(
    pastContracts,
    'contractId',
  );
  const pastContractIds = Object.keys(pastContractIdsIndexedByContractIds);

  // get all contracts (including actual and changed)
  const allContract = await GfContract.findAll({
    where: {
      [Op.or]: [{ clientId }, { id: pastContractIds }],
    },
    include: contractRelatedInfo,
  });

  // normalize contracts based on actual or changed
  allContract.forEach((contract) => {
    const contractObject = {
      contract,
      type: 'actual',
    };

    if (pastContractIds.includes(contract.id)) {
      contractObject.type = 'hc';
      contractObject.change =
        pastContractIdsIndexedByContractIds[contract.id][0];
    }
    contractIds[contract.id] = contractObject;
  });
  return contractIds;
};
