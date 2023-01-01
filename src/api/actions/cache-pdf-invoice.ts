import { deleteFile } from '@api/service/file/fileService';
import { cacheInvoice } from '@api/service/intranet/InvoiceView';
import { intranet } from '@models';

const { GfInvoiceInvoice } = intranet;
import assert from 'assert';

export default async function cache(params: { invoiceId: number }) {
  const { invoiceId } = params;

  //get invoice of last 3 months
  const invoice = await GfInvoiceInvoice.findByPk(invoiceId);
  assert(invoice, 'invoice not found');
  const last3MonthRefererKey = invoice.refererKey.replace(
    `[periodId:${invoice.periodId}]`,
    `[periodId:${invoice.periodId - 3}]`,
  );
  const last3MonthInvoice = await GfInvoiceInvoice.findOne({
    where: { refererKey: last3MonthRefererKey },
  });

  //remove old invoice (we only keep 3 invoice for each profile)
  if (last3MonthInvoice)
    deleteFile(`${last3MonthInvoice.code}.pdf`, 'cache-invoice');

  cacheInvoice(invoiceId);
}
