// @ts-check
'use strict';

const GfContractService = require('./GfContractService');
const { GfKamailioUnifiedCdr } = require('@models').intranet;
const { Op } = require('sequelize');
const moment = require('moment');
const { AnyModel } = require('@models');

exports.getConsumptionLines = async (contractId, clientId, init, end) => {
  const history = await GfContractService.getContractHistory(
    contractId,
    init,
    end,
  );
  init = history.holders[clientId][0].init;
  end = history.holders[clientId][0].end;

  const lines = await GfKamailioUnifiedCdr.findAll({
    where: {
      contractId,
      date: {
        [Op.between]: [init, end],
      },
    },
  });

  const fLines = [];
  for (const l of lines) {
    fLines.push({
      origen: l.from,
      destino: l.to,
      fecha: l.date,
      serviceType: l.callType,
      segundos: l.seconds,
      importe: l.userCharge,
      descripcion: l.description,
    });
  }

  return {
    success: true,
    data: fLines,
  };
};

exports.getConsumptionLinesForMultipleContracts = async (
  contracts,
  clientId,
  init,
  end,
) => {
  /**
   * @type {Record<string,{init: string, end: string}>}
   */
  const contractHoldersDate = {};
  for (const contract of contracts) {
    const holderHistory = GfContractService.getHolders(
      contract,
      moment(init),
      moment(end),
    );
    contractHoldersDate[contract.id] = {
      init: holderHistory[clientId][0].init,
      end: holderHistory[clientId][0].end,
    };
  }

  /**
   * @type {Record<string,AnyModel[]>}
   */
  const contractsLines = {};
  for (const contractId in contractHoldersDate) {
    const contractDate = contractHoldersDate[contractId];
    contractsLines[contractId] = await GfKamailioUnifiedCdr.findAll({
      where: {
        contractId,
        date: {
          [Op.between]: [contractDate.init, contractDate.end],
        },
      },
    });
  }

  // await Promise.all(Object.values(contractsLines));
  /**
   * @type {Record<string,{origen:string,destino:string,fecha:string,serviceType:string,segundos:string,importe:string,descripcion:string}[]>}
   */
  const normalizedContractsLines = {};
  for (const contractId in contractsLines) {
    const contractLines = contractsLines[contractId];
    const normalizedLines = [];
    for (const l of contractLines) {
      normalizedLines.push({
        origen: l.from,
        destino: l.to,
        fecha: l.date,
        serviceType: l.callType,
        segundos: l.seconds,
        importe: l.userCharge,
        descripcion: l.description,
      });
    }
    normalizedContractsLines[contractId] = normalizedLines;
  }

  return {
    success: true,
    data: normalizedContractsLines,
  };
};
