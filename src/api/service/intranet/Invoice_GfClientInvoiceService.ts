// @ts-check
'use strict';

import { AnyModel, intranet } from '@models';

const {
  GfContractSection,
  GfContractHolderChange,
  GfContract,
  GfInvoiceInvoice,
  transaction,
  GfActiveFee,
} = intranet;

import moment from 'moment';

import {
  getPeriodPointer,
  getPeriodPointerForContractIds,
} from './Invoice_GfPointerService';

import * as Invoice_GfInvoiceControlService from './Invoice_GfInvoiceControlService';

import * as GfInvoiceService from './GfInvoiceService';

import * as InvoiceInvoiceService from './InvoiceInvoiceService';

import * as PaymentService from './PaymentService';

import _ from 'lodash';

import to from 'await-to-js';

import { Static } from '@lib/cache';
import { Op, literal } from 'sequelize';

type ContractInfoToInvoice = Record<
  string,
  | { contract: AnyModel; type: CONTRACT_TYPE.HC; change: AnyModel }
  | { contract: AnyModel; type: CONTRACT_TYPE.AC }
>;

type ClientsContractInfoToInvoice = Record<string, ContractInfoToInvoice>;

type PeriodPointer = Awaited<ReturnType<typeof getPeriodPointer>>;

export const cachedInvolvedContracts = async (
  force = false,
  period: AnyModel,
) => {
  return Static.sear(
    'cachedInvolvedContracts',
    async () => {
      const startOfPeriod = moment(period.period)
        .subtract(1, 'month')
        .format('YYYY-MM-DD');
      const holderChanges = _.groupBy(
        await GfContractHolderChange.findAll({
          where: {
            changeDate: {
              [Op.gte]: startOfPeriod,
            },
            state: 'done',
          },
          include: {
            model: GfContract,
            as: 'contract',
            include: [
              { model: GfContractSection, as: 'section' },
              { model: GfContractHolderChange, as: 'holders', required: false },
              { model: GfActiveFee, as: 'activeFee' },
            ],
          },
        }),
        'fromClientId',
      );

      const contracts = _.groupBy(
        await GfContract.findAll({
          attributes: {
            include: [
              [
                literal(`
                  (SELECT COUNT(*) FROM gf_discounts_scheduled
                    WHERE contractId = GfContract.id
                    AND state = 'pending'
                    AND status = 1)
                `),
                'pendingDiscounts',
              ],
            ],
          },
          include: [
            { model: GfActiveFee, as: 'activeFee' },
            { model: GfContractSection, as: 'section' },
          ],
        }),
        'clientId',
      );

      const allIvolvedClientIds = [
        ...new Set(Object.keys(contracts).concat(Object.keys(holderChanges))),
      ];

      let numberOfContracts = 0;
      const indexedContracts: ClientsContractInfoToInvoice = {};
      for (const clientId of allIvolvedClientIds) {
        indexedContracts[clientId] = {};
        const clientHolderChanges = holderChanges[clientId] ?? [];
        for (const holderChange of clientHolderChanges) {
          indexedContracts[clientId][holderChange.contractId] = {
            type: CONTRACT_TYPE.HC,
            change: holderChange,
            contract: holderChange.contract,
          };
        }

        const clientsContracts = contracts[clientId] ?? [];
        for (const contract of clientsContracts) {
          if (
            contract.state === 'suspended' &&
            moment(contract.dateDeactivation).isBefore(moment(startOfPeriod)) &&
            !contract.pendingDiscounts
          )
            continue;
          indexedContracts[clientId][contract.id] = {
            type: CONTRACT_TYPE.AC,
            contract: contract,
          };
          numberOfContracts++;
        }
      }

      console.log('number of contracts: ', numberOfContracts);

      return indexedContracts;
    },
    1200,
    force,
  );
};

enum CONTRACT_TYPE {
  HC = 'hc',
  AC = 'ac',
}

type ContractInfo =
  | { contract: AnyModel; type: CONTRACT_TYPE.HC; change: AnyModel }
  | { contract: AnyModel; type: CONTRACT_TYPE.AC };

type ContractsInfo = Record<string, ContractInfo>;

export const _getInvolvedContracts = async (
  clientId: number,
  comeFromControlRows = false,
  period: AnyModel,
) => {
  if (comeFromControlRows) {
    const contractIds: ContractsInfo = {};

    const startOfPeriod = moment(period.period)
      .subtract(1, 'month')
      .format('YYYY-MM-DD');

    // list of past contract ids
    const pastContractsHolder = await GfContractHolderChange.findAll({
      where: {
        fromClientId: clientId,
        changeDate: {
          [Op.gte]: startOfPeriod,
        },
        state: 'done',
      },
    });
    const pastContractIdsIndexedByContractIds = _.groupBy(
      pastContractsHolder,
      'contractId',
    );
    const pastContractIds = Object.keys(
      pastContractIdsIndexedByContractIds,
    ).map((id) => Number(id));

    // get all contracts (including actual and changed)
    const actualContracts = await GfContract.findAll({
      where: { clientId },
      attributes: {
        include: [
          [
            literal(`
              (SELECT COUNT(*) FROM gf_discounts_scheduled
                WHERE contractId = GfContract.id
                AND state = 'pending'
                AND status = 1)
            `),
            'pendingDiscounts',
          ],
        ],
      },
      include: [
        { model: GfContractSection, as: 'section' },
        { model: GfContractHolderChange, as: 'holders', required: false },
        { model: GfActiveFee, as: 'activeFee' },
      ],
    });

    const pastContracts = await GfContract.findAll({
      where: {
        id: pastContractIds,
      },
      include: [
        { model: GfActiveFee, as: 'activeFee' },
        { model: GfContractSection, as: 'section' },
      ],
    });

    // normalize contracts based on actual or changed
    pastContracts.forEach((pastContract) => {
      const contractObject = {
        contract: pastContract,
        type: CONTRACT_TYPE.HC,
        change: pastContractIdsIndexedByContractIds[pastContract.id][0],
      };
      contractIds[pastContract.id] = contractObject;
    });

    actualContracts.forEach((contract) => {
      const contractObject = {
        contract,
        type: CONTRACT_TYPE.AC as CONTRACT_TYPE.AC, //CHECK TS
      };
      if (
        !(
          contract.state === 'suspended' &&
          moment(contract.deactivationDate).isBefore(moment(startOfPeriod)) &&
          !contract.pendingDiscounts
        )
      )
        contractIds[contract.id] = contractObject;
    });
    return contractIds;
  }
  const caches = await cachedInvolvedContracts(false, period);

  return caches[clientId] ?? [];
};

export const generateClientInvoice = async (
  controlRowsOfClient: AnyModel[],
  profileId: number,
  userId: number,
  comeFromControlRows = false,
  period: AnyModel,
) => {
  const clientId = controlRowsOfClient[0].clientId;
  const contractIds = await _getInvolvedContracts(
    clientId,
    comeFromControlRows,
    period,
  );
  for (const control of controlRowsOfClient) {
    if (profileId !== control.invoiceProfileId) {
      continue;
    }

    if (control.invoiceId > 0)
      throw Error('Invoice id present for this control');

    const [error, result] = await to(
      transaction(async () => {
        const generatedInvoice = await generateInvoiceByControlRow(
          control,
          userId,
          contractIds,
          comeFromControlRows,
        );

        control.mustReview = generatedInvoice.toReview;

        if ('nothing' in generatedInvoice || 'noError' in generatedInvoice)
          return {
            control,
            invoice: null,
            payments: [],
            lines: [],
            gfInvoiceLines: [],
            cellInvoiceLines: [],
            discountChanges: [],
          };

        const { control: consolidedControl, invoice } =
          await Invoice_GfInvoiceControlService.consolideControlInAutomaticInvoice(
            control,
            generatedInvoice.invoice,
          );

        return {
          control: consolidedControl,
          invoice,
          payments: generatedInvoice.payments,
          lines: generatedInvoice.lines,
          gfInvoiceLines: generatedInvoice.gfInvoiceLines,
          cellInvoiceLines: generatedInvoice.cellInvoiceLines,
          discountChanges: generatedInvoice.discountChanges,
        };
      }),
    );

    if (error) throw error;
    return result;
  }
};

const generateInvoiceByControlRow = async (
  control: AnyModel,
  userId: number,
  contractIds: Awaited<ReturnType<typeof _getInvolvedContracts>>,
  comeFromControlRows = false,
) => {
  const client = control.client;
  const date = control.periodDate;
  const profileId = control.invoiceProfileId;
  checkInvoiceDate(date);
  const invoiceAndPaymentKey = `[gfClient:${client.id}],[periodId:${control.periodId}],[profileId:${control.invoiceProfileId}]`;
  let toReview = false;

  const discountChanges: {
    histories: Awaited<
      ReturnType<typeof GfInvoiceService.setAppliedInvoiceProcess>
    >['histories'];
    newScheduled: Awaited<
      ReturnType<typeof GfInvoiceService.setAppliedInvoiceProcess>
    >['nextScheduled'][];
    updateScheduled: Awaited<
      ReturnType<typeof GfInvoiceService.setAppliedInvoiceProcess>
    >['scheduled'][];
  } = {
    histories: [],
    newScheduled: [],
    updateScheduled: [],
  };

  const period_pointers = await getPeriodPointerForContractIds(contractIds);
  const cellInvoiceLines = [];
  let allLines: Awaited<
    ReturnType<typeof GfInvoiceService.generateIlines>
  >['lines'] = [];
  for (const contractId in contractIds) {
    const contractInfo = contractIds[contractId];
    const mustHave = period_pointers[contractId];

    if (
      !sameProfileId(profileId, mustHave) ||
      !holderChangeContractIsInPeriod(contractInfo, mustHave)
    )
      continue;

    const invoiceLinesInfo = await GfInvoiceService.generateIlines(
      mustHave.period,
      contractInfo.contract,
      client,
      control.id,
      userId,
      comeFromControlRows,
    );

    toReview = invoiceLinesInfo.toReview ? true : false;
    allLines.push(...invoiceLinesInfo.lines);
    if (
      'cellInvoiceLine' in invoiceLinesInfo &&
      invoiceLinesInfo.cellInvoiceLine
    )
      cellInvoiceLines.push(invoiceLinesInfo.cellInvoiceLine);
    if (
      'discountChanges' in invoiceLinesInfo &&
      invoiceLinesInfo.discountChanges
    ) {
      discountChanges.histories.push(
        ...invoiceLinesInfo.discountChanges.histories,
      );
      discountChanges.updateScheduled.push(
        ...invoiceLinesInfo.discountChanges.updateScheduled,
      );
      discountChanges.newScheduled.push(
        ...invoiceLinesInfo.discountChanges.newScheduled,
      );
    }
  }

  const uniqueTelfs = new Set();
  const filteredLines = allLines.filter((line) => {
    if (line.code === 'FIXCONSUM2') {
      const tel = JSON.parse(line.parameters).telf;
      if (uniqueTelfs.has(tel)) {
        return false;
      }
      uniqueTelfs.add(tel);
    }
    return true;
  });

  allLines = filteredLines;

  if (!allLines.length) {
    return {
      nothing: true,
      toReview,
      reason: 'nothing to invoice',
    };
  }

  const paymentTypeId = await GfInvoiceService.getPaymentTypeId(
    client,
    profileId,
  );

  const ret = await GfInvoiceService.generateInvoice(
    client,
    moment(date).startOf('month'),
    allLines,
    invoiceAndPaymentKey,
    paymentTypeId,
    userId,
  );

  if (!ret.invoice)
    return {
      reason: 'user no billable',
      noError: true,
    };

  const invoice = ret.invoice;

  await PaymentService.initPeriodType();
  const payments =
    await PaymentService.createInvoicePaymentsForAutomaticInvoice(
      ret.invoice,
      paymentTypeId,
      invoiceAndPaymentKey,
    );

  return {
    invoice,
    payments,
    toReview,
    lines: ret.lines,
    gfInvoiceLines: allLines,
    cellInvoiceLines,
    discountChanges,
  };
};

const checkInvoiceDate = (date: string) => {
  const currentDate = moment();
  const requestedDate = moment(date);

  const monthDifference = requestedDate.diff(currentDate, 'months');

  if (monthDifference < 0) throw new Error('cannot invoice past months');

  if (monthDifference > 1)
    throw new Error('cannot go more than 1 month in the future');
};

const sameProfileId = (profileId: number, mustHave: PeriodPointer) => {
  const contractInvoiceProfileId =
    (mustHave.contract.invoiceProfileId ?? 0) < 0
      ? 0
      : mustHave.contract.invoiceProfileId ?? 0;
  return contractInvoiceProfileId === profileId ? true : false;
};

const holderChangeContractIsInPeriod = (
  contractInfo: ContractInfo,
  mustHave: PeriodPointer,
) => {
  if (contractInfo.type === 'hc') {
    const changeDate = moment(contractInfo.change.changeDate);
    const initPeriod = moment(mustHave.period.initDate);
    const endPeriod = moment(mustHave.period.endDate);
    if (!mustHave.period.isRecursive) return false;
    if (
      changeDate.isValid() &&
      !(
        changeDate.isSameOrAfter(initPeriod) &&
        changeDate.isSameOrBefore(endPeriod)
      )
    )
      return false;
  }
  return true;
};

export const issueInvoice = async (invoiceControl: AnyModel) => {
  if (invoiceControl.total <= 0) {
    //noting to invoice
    invoiceControl.issued = 2;
    await invoiceControl.save();
    return {
      success: true,
    };
  }

  let invoice = invoiceControl.invoice;
  if (!invoice) {
    invoice = await GfInvoiceInvoice.findByPk(invoiceControl.invoiceId);
  }

  if (
    parseFloat(invoice.total).toFixed(2) !==
    parseFloat(invoiceControl.total).toFixed(2)
  ) {
    invoiceControl.withError = 1;
    invoiceControl.errorPhase = 'issued';
    invoiceControl.errorDescription = `Invoice total and control row total don't match (${parseFloat(
      invoiceControl.total,
    ).toFixed(2)} vs. ${parseFloat(invoice.total).toFixed(2)})\n${
      invoiceControl.errorDescription
    }`;
    await invoiceControl.save();
    return {
      success: false,
      reason: "imports don't match",
    };
  }
  try {
    if (invoice.total <= 0) throw new Error('Impossible invoice total');

    const issuedInvoice = await InvoiceInvoiceService.issueInvoice(invoice);
    invoiceControl.issuedNumber = issuedInvoice.code;
    invoiceControl.issued = 1;
    await invoiceControl.save();
    return {
      success: true,
      invoice: issuedInvoice,
    };
  } catch (error) {
    invoiceControl.errorPhase = 'issued';
    invoiceControl.withError = 1;
    invoiceControl.errorDescription = `${error}\n${invoiceControl.errorDescription}`;
    await invoiceControl.save();
    return {
      success: false,
      reason: error,
    };
  }
};
