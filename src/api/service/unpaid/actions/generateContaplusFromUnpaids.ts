import moment from 'moment';
import jszip from 'jszip';
import { Op } from 'sequelize';
import ContaplusManager from '@api/service/intranet/ContaplusService/contaplusManager';

import { intranet } from '@models';
const { UnpaidInvoice, GfInvoiceInvoice } = intranet;

type Bank = 'Sabadell' | 'Guisona' | 'all';
type InvoiceStatus = 'paid' | 'unpaid';

interface ContaplusResult {
  filename: string;
  buffer: Buffer;
}

interface UnpaidWithInvoices {
  id: number;
  invoice_date: string;
  unpaid_fee?: number;
  invoice: { total?: number } | null;
}

export class ContaplusUnpaidProcessor {
  private status: InvoiceStatus;
  private bank: Bank;
  private month: string;
  private startDate: string;
  private endDate: string;
  private normalizedBank: Bank;

  constructor(status: InvoiceStatus, bank: Bank, month: string) {
    this.status = status;
    this.bank = bank;
    this.month = month;

    const { startDate, endDate, normalizedBank } = this.validateInputs();
    this.startDate = startDate;
    this.endDate = endDate;
    this.normalizedBank = normalizedBank;
  }

  public async process(): Promise<ContaplusResult> {
    const invoices = await this.fetchUnpaidInvoices();

    if (!invoices.length) {
      throw new Error(
        `No ${this.status} invoices found for bank "${this.bank}" in "${this.month}"`,
      );
    }

    const controlSum = this.calculateControlSum(invoices);
    const contaplus = this.generateContaplus(invoices, controlSum);
    const filenamePrefix = `${this.status}_${this.normalizedBank}_${moment(
      this.month,
    ).format('YYYYMM')}`;

    return this.generateZip(contaplus, filenamePrefix);
  }

  private validateInputs(): {
    startDate: string;
    endDate: string;
    normalizedBank: Bank;
  } {
    const parsedMonth = moment(this.month, 'YYYY-MM', true);
    if (!parsedMonth.isValid()) {
      throw new Error(
        `Invalid month format. Expected 'YYYY-MM'. Got: ${this.month}`,
      );
    }

    const normalizedBank = this.bank.toLowerCase() as Bank;
    if (!['Sabadell', 'Guisona', 'all'].includes(normalizedBank)) {
      throw new Error(`Unsupported bank: ${this.bank}`);
    }

    return {
      startDate: parsedMonth.startOf('month').format('YYYY-MM-DD'),
      endDate: parsedMonth.endOf('month').format('YYYY-MM-DD'),
      normalizedBank,
    };
  }

  private fetchUnpaidInvoices(): Promise<UnpaidWithInvoices[]> {
    const whereClause: any = {
      invoice_status: this.status,
      invoice_date: {
        [Op.between]: [this.startDate, this.endDate],
      },
    };

    if (this.normalizedBank !== 'all') {
      whereClause.payment_bank_name = {
        [Op.iLike]: `%${this.normalizedBank}%`,
      };
    }

    return UnpaidInvoice.findAll({
      where: whereClause,
      include: [{ model: GfInvoiceInvoice, as: 'invoice' }],
    }) as unknown as Promise<UnpaidWithInvoices[]>;
  }

  private getInvoiceTotalAmount(
    invoice: { total?: number } | null,
    unpaid_fee?: number,
  ): number {
    const invoiceAmount = invoice?.total ?? 0;
    const commissionAmount = unpaid_fee ?? 0;
    return invoiceAmount + commissionAmount;
  }

  private calculateControlSum(invoices: UnpaidWithInvoices[]): number {
    return invoices.reduce((sum, unpaid) => {
      const total = this.getInvoiceTotalAmount(
        unpaid.invoice,
        unpaid.unpaid_fee,
      );
      const signedTotal = this.status === 'unpaid' ? -total : total;
      return sum + signedTotal;
    }, 0);
  }

  private generateContaplus(
    invoices: UnpaidWithInvoices[],
    controlSum: number,
  ): ContaplusManager {
    const contaplus = new ContaplusManager();
    contaplus.resetAssienNum();
    contaplus.ref = moment().format('mmss');

    const remitCode = `${this.status.toUpperCase()}/${this.bank.toUpperCase()}/${
      this.month
    }`;
    contaplus.setRemitanceCode(remitCode as any);
    contaplus.initSageForRemitance(controlSum as any);

    for (const unpaid of invoices) {
      const total = this.getInvoiceTotalAmount(
        unpaid.invoice,
        unpaid.unpaid_fee,
      );
      if (isNaN(total)) {
        console.warn(`Invalid total for unpaid ID ${unpaid.id}`);
        continue;
      }

      const signedAmount = this.status === 'unpaid' ? -total : total;
      const date = unpaid.invoice_date || moment().format('YYYY-MM-DD');
      contaplus.addRemitance(unpaid.invoice, signedAmount, date);
    }

    return contaplus;
  }

  private async generateZip(
    contaplus: ContaplusManager,
    filenamePrefix: string,
  ): Promise<ContaplusResult> {
    const zip = new jszip();
    const files = contaplus.getFiles();

    zip.file(`${filenamePrefix}_subcuentas.csv`, files.subcuentas);
    zip.file(`${filenamePrefix}_diario.csv`, files.diario);

    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    const filename = `${filenamePrefix}_${moment().format('HHmmss')}.zip`;

    return { filename, buffer };
  }
}
