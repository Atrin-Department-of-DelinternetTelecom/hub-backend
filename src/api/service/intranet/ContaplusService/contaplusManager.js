'use strict';
const SageContaplus = require('./sageContaplus');
const xml2js = require('xml2js');
const moment = require('moment');
const _ = require('lodash');
const exactMath = require('exact-math');
const { GfInvoiceControl, GfInvoiceInvoice } = require('@models').intranet;
const { Op } = require('sequelize');

class ContaplusManager {
  constructor() {
    this.sage = new SageContaplus();
  }

  resetAssienNum() {
    this.assienNum = 0;
  }

  mapRemitanceTx(tx, controlTotal, invoice) {
    const total = tx.InstdAmt[0]._;

    //find in GfInvoiceControlAdo by invoiceId
    /* $invoice = $ado.selectOne([
            "id"  => $invoiceId
        ]); */

    if (!invoice) {
      console.log(`No invoice ${tx.DrctDbtTx[0].MndtRltdInf[0].MndtId[0]}`);
      return false;
    }

    controlTotal = exactMath.add(controlTotal, total);

    //

    const txDate = tx.DrctDbtTx[0].MndtRltdInf[0].DtOfSgntr[0];
    this.addRemitance(invoice, total, txDate);
    return controlTotal;
  }

  async getRemitanceCsvFromSepaXml(file, clientsMapIds, remitanceCode) {
    this.resetAssienNum();
    this.ref = moment().format('MMDDmmss');
    this.clientsMapIds = clientsMapIds;
    const parser = xml2js.Parser();
    const remitance = await parser.parseStringPromise(file);
    const controlSum =
      remitance.Document.CstmrDrctDbtInitn[0].GrpHdr[0].CtrlSum[0];

    const ret = this.setRemitanceCode(remitanceCode);
    if (!ret.success) {
      return {
        success: false,
        reason: ret.reason,
      };
    }

    this.initSageForRemitance(controlSum);

    let controlTotal = 0;

    const txs = remitance.Document.CstmrDrctDbtInitn[0].PmtInf[0].DrctDbtTxInf;
    const invoiceIds = txs.map(
      (tx) => tx.DrctDbtTx[0].MndtRltdInf[0].MndtId[0].split(':')[0],
    );
    const invoices = {};
    (await GfInvoiceInvoice.findAll({ where: { id: invoiceIds } })).forEach(
      (invoice) => {
        invoices[invoice.id] = invoice;
      },
    );

    txs.forEach((tx) => {
      controlTotal = this.mapRemitanceTx(
        tx,
        controlTotal,
        invoices[tx.DrctDbtTx[0].MndtRltdInf[0].MndtId[0].split(':')[0]],
      );
    });

    if (!controlTotal) {
      return {
        success: false,
        reason: 'No invoice',
      };
    }

    if (exactMath.round(controlTotal, 4) != exactMath.round(controlSum, 4)) {
      return {
        success: false,
        reason: `Totals don't match ${controlTotal} != ${controlSum}`,
      };
    }
    return {
      success: true,
      files: this.getFiles(),
      ref: this.ref,
    };
  }

  initSageForInvoices() {
    this.mode = 'invoices';

    // add VENDES SERVEIS
    this.sage.addSubCuenta({
      Cod: '70500000',
      Título: 'VENDES SERVEIS',
    });

    // add IVA
    this.sage.addSubCuenta({
      Cod: '47700021',
      Título: 'H.P. Iva Devengado 21%.',
      TipoIVA: 'G',
      TPC: 21, // PS:
      RecEquiv: 0,
    });
  }

  initSageForRemitance(controlSum = undefined, subCuentaCode = '43100000') {
    this.mode = 'remitance';

    // PS:
    this.sage.addSubCuenta({
      Cod: '43100000',
      Título: 'Clientes, efectos comerciales a cobrar',
    });

    // contra cobros
    this.sage.addDiario({
      Asien: 1,
      Fecha: '20170301',
      SubCta: subCuentaCode,
      PtaDebe: (Number(controlSum) * Number(166.386)).toFixed(5),
      Concepto: `[RMC]${this.remitanceCode}/${this.ref}`,
      Factura: this.remitanceNum,
      Documento: this.remitanceDocumento,
      Serie: this.remitanceShortSerie,
      MonedaUso: 2, // euros,
      EuroDebe: controlSum,
    });
    return {
      success: true,
    };
  }

  getClientSubcuenta(clientId = undefined) {
    let id;
    if (
      this.clientsMapIds &&
      !_.isUndefined(this.clientsMapIds[clientId]) &&
      this.clientsMapIds[clientId] != ''
    ) {
      id = this.clientsMapIds[clientId];
    } else {
      id = clientId;
    }
    if (id == 0) {
      throw new Error(`ClientSubcuenta not found (ClientId:${clientId}`);
    }
    const subCuenta = `430${this.zeroifica(id, 5)}`;
    return subCuenta;
  }

  addRemitance(invoice, total, date) {
    const subCuenta = this.getClientSubcuenta(invoice.clientId);
    if (!this.sage.subCuentaExists(subCuenta)) {
      this.sage.addSubCuenta({
        Cod: subCuenta,
        Título: invoice.clientName.slice(0, 40),
        Nif: invoice.clientNif,
      });
    }
    this.sage.addDiario({
      // contra client
      Asien: 1,
      Fecha: moment(date, 'YYYY-MM-DD').format('YYYYMMDD'),
      SubCta: subCuenta,
      PtaHaber: exactMath.mul(total, 166.386),
      Concepto: `[RMC]${this.remitanceCode}/${this.ref}`,
      Factura: this.remitanceNum,
      Documento: this.remitanceDocumento,
      Serie: this.remitanceShortSerie,
      MonedaUso: 2, // euros,
      EuroHaber: total,
    });
  }

  zeroifica(number, sub) {
    number = `00000000000${number}`;
    return number.substr(sub * -1);
  }

  getFiles() {
    return {
      subcuentas: this.sage.getSubcuentas(),
      diario: this.sage.getDiario(),
    };
  }

  setRemitanceCode(remitanceCode = null) {
    const codeParts = remitanceCode.split('/');
    if (codeParts.length != 2) {
      return {
        success: false,
        reason: `remitance code not compatible (${remitanceCode})`,
      };
    }
    this.remitanceCode = remitanceCode;
    this.remitanceSerie = codeParts[0];
    this.remitanceNum = codeParts[1];
    this.remitanceDocumento = `${codeParts[0]}${this.zeroifica(
      codeParts[1],
      5,
    )}`;
    this.remitanceShortSerie = codeParts[0].slice(0, 1);

    return {
      success: true,
    };
  }

  /**
   *
   * @param {{start:string,end:string}} dates
   * @param {object} clientsMap
   * @param {string|null} invoiceCodes
   */
  static async getInvoicesCsv(dates, clientsMap, invoiceCodes = null) {
    const instance = new ContaplusManager();
    instance.clientsMapIds = clientsMap;
    instance.resetAssienNum();
    instance.ref = moment().format('MMDDmmss');

    let filter;
    if (invoiceCodes) {
      filter = { code: invoiceCodes.split('|') };
    } else {
      filter = {
        state: ['issued', 'canceled', 'rectificative'],
        date: {
          [Op.between]: [dates.start, dates.end],
        },
      };
    }

    instance.initSageForInvoices();
    const invoices = await GfInvoiceInvoice.findAll({
      where: filter,
      include: { model: GfInvoiceControl, as: 'control_row', required: false },
    });
    const updateInvoices = [];
    for (const invoice of invoices) {
      instance.addInvoice(invoice);
      updateInvoices.push({
        id: invoice.id,
        contabilityExported: 1,
        contabilityRef: instance.ref,
      });
    }

    await GfInvoiceInvoice.bulkCreate(updateInvoices, {
      updateOnDuplicate: [
        'contabilityExported',
        'contabilityRef',
        'updateDate',
      ],
    });

    return {
      success: true,
      files: instance.getFiles(),
      ref: instance.ref,
    };
  }

  addInvoice(invoice) {
    const codeParts = invoice.code.split('/');
    if (codeParts.length != 2) {
      return {
        success: false,
        reason: `invoice code not compatible ${invoice.code}`,
      };
    }

    const invSerie = codeParts[0];
    const invNumber = codeParts[1];

    const sage = this.sage;
    const subCuenta = this.getClientSubcuenta(invoice.clientId);
    if (!this.sage.subCuentaExists(subCuenta)) {
      this.sage.addSubCuenta({
        Cod: subCuenta,
        Título: invoice.clientName.slice(0, 40),
        Nif: invoice.clientNif,
      });
    }

    const nextAssien = this.assienNum++;

    let baseTotal = 0;
    let taxsTotal = 0;
    let total = 0;
    if (!invoice.control_row) {
      baseTotal = Number(invoice.baseTotal).toFixed(2);
      taxsTotal = Number(invoice.taxesTotal).toFixed(2);
      total = (Number(baseTotal) + Number(taxsTotal)).toFixed(2);
    } else {
      baseTotal = Number(invoice.control_row.baseTotal).toFixed(2);
      taxsTotal = Number(invoice.control_row.taxsTotal).toFixed(2);
      total = (Number(baseTotal) + Number(taxsTotal)).toFixed(2);
    }

    if (total < 0 && invoice.state != 'rectificative') {
      return 'total < 0';
    }
    if (total > 0 && invoice.state == 'rectificative') {
      return 'total > 0';
    }

    const r1 = {
      Asien: nextAssien,
      Fecha: moment(invoice.date).format('YYYYMMDD'),
      SubCta: subCuenta,
      Concepto: `[FAC]${invoice.code}`,
      Factura: invNumber,
      Factura10: invNumber,
      Documento: invoice.id,
      Serie: invSerie.substring(0, 1),
      MonedaUso: 2,
      TipoFac: 'E',
    };

    if (invoice.state !== 'rectificative') {
      r1.PtaDebe = (Number(total) * 166.386).toFixed(6);
      r1.EuroDebe = Number(total).toFixed(2);
    } else {
      r1.PtaHaber = (Number(total) * -166.386).toFixed(6);
      r1.EuroHaber = (Number(total) * -1).toFixed(2);
    }
    sage.addDiario(r1);

    const r2 = {
      Asien: nextAssien,
      Fecha: moment(invoice.date).format('YYYYMMDD'),
      SubCta: '70500000',
      Concepto: `[FAC]${invoice.code}`,
      Factura: invNumber,
      Factura10: invNumber,
      Documento: invoice.id,
      Serie: invSerie.substring(0, 1),
      MonedaUso: 2,
      TipoFac: 'E',
    };
    if (invoice.state !== 'rectificative') {
      r2.PtaHaber = (Number(baseTotal) * 166.386).toFixed(6);
      r2.EuroHaber = Number(baseTotal).toFixed(2);
    } else {
      r2.PtaDebe = (Number(baseTotal) * -166.386).toFixed(6);
      r2.EuroDebe = (Number(baseTotal) * -1).toFixed(2);
    }
    sage.addDiario(r2);

    const r3 = {
      Asien: nextAssien,
      Fecha: moment(invoice.date).format('YYYYMMDD'),
      SubCta: '47700021',
      Contra: subCuenta,
      Concepto: `[FAC]${invoice.code}`,
      Factura: invNumber,
      Factura10: invNumber,
      Documento: invoice.id,
      Serie: invSerie.substring(0, 1),
      MonedaUso: 2,
      TipoFac: 'E',
      IVA: 21.0,
      Fecha_OP: moment(invoice.date).format('YYYYMMDD'),
      Fecha_EX: moment(invoice.date).format('YYYYMMDD'),
    };

    if (invoice.state !== 'rectificative') {
      r3.PtaHaber = (Number(taxsTotal) * 166.386).toFixed(6);
      r3.Baseimpo = (Number(baseTotal) * 166.386).toFixed(6);
      r3.EuroHaber = Number(taxsTotal).toFixed(2);
      r3.BaseEuro = Number(baseTotal).toFixed(2);
    } else {
      r3.PtaDebe = (Number(taxsTotal) * -166.386).toFixed(6);
      r3.Baseimpo = (Number(baseTotal) * -166.386).toFixed(6);
      r3.EuroDebe = (Number(taxsTotal) * -1).toFixed(2);
      r3.BaseEuro = (Number(baseTotal) * -1).toFixed(2);
    }
    sage.addDiario(r3);
  }
}

module.exports = ContaplusManager;
