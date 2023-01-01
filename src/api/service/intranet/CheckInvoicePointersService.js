'use strict';

const { GfContract, GfContractHolderChange, GfScheduledInvoiceLine } =
  require('@models').intranet;

const { Op } = require('sequelize');
const Invoice_GfPointerService = require(`./Invoice_GfPointerService`);

exports.checkPointers = async function (contractId, next = false) {
  if (!contractId) await exports.deleteOrphan();

  return exports.checkPointersIntegrity(contractId, next);
};

exports.deleteOrphan = async function () {
  const orphans = await GfScheduledInvoiceLine.findAll({
    include: [
      {
        model: GfContract.unscoped(),
        as: 'contract',
        required: true,
        where: {
          status: 0,
        },
      },
    ],
  });

  await GfScheduledInvoiceLine.update(
    {
      status: 0,
    },
    {
      where: {
        id: orphans.map((orphan) => orphan.id),
      },
    },
  );
};

exports.checkPointersIntegrity = async function (contractId, next = false) {
  const wheres = contractId ? { id: contractId } : {};
  const contracts = await GfContract.findAll({
    where: wheres,
    order: [['id', 'ASC']],
  });

  for (const contract of contracts) {
    if (contract.isPendingSectionsReady()) continue;

    const pointer = await Invoice_GfPointerService.getPeriodPointer(
      contract,
      next,
    );

    // locate all clients that must be invoiced
    const historicHolders = await GfContractHolderChange.findAll({
      where: {
        contractId: contract.id,
        changeDate: {
          [Op.between]: [pointer.period.initDate, pointer.period.endDate],
        },
      },
    });

    const clientIds = historicHolders
      .map((holder) => holder.fromClientId)
      .push(contract.clientId);

    for (const index in clientIds) {
      const invoice = await GfScheduledInvoiceLine.findOne({
        where: {
          contractId: contract.id,
          procesed: 0,
          clientId: clientIds[index],
        },
      });

      // no sch, create it
      if (invoice === null) {
        await exports.createSch(contract, clientIds[index], pointer.period);
      } else if (
        invoice.initDate != pointer.period.initDate ||
        invoice.endDate != pointer.period.endDate ||
        invoice.payDate != pointer.period.payDate ||
        invoice.isRecursive != pointer.period.isRecursive
      ) {
        await exports.repareNoMatchingParams(contract, invoice, pointer.period);
      }
    }
  }
};

exports.createSch = async function (contract, clientId, mustHave) {
  const wheres = {
    contractId: contract.id,
    clientId: clientId,
    initDate: mustHave.initDate,
    endDate: mustHave.endDate,
    payDate: mustHave.payDate,
    isRecursive: mustHave.isRecursive ? 1 : 0,
    procesed: 1,
  };

  const attributes = wheres;
  attributes.procesed = 0;

  const [instance, created] = await GfScheduledInvoiceLine.findOrCreate(
    {
      where: wheres,
    },
    attributes,
  );

  return created
    ? { success: true, schId: instance.id }
    : { success: true, reason: "Exists as processed, don't create it again" };
};

exports.repareNoMatchingParams = async function (contract, invoice, mustHave) {
  await invoice.update({
    // delete invoice
    status: 0,
  });

  return exports.createSch(contract, invoice, mustHave);
};
