import { createRoute } from '@api/utils/controller-factory';
import * as InvoiceMailService from '@service/intranet/InvoiceMailService';

export const send = createRoute({
  async handler(req) {
    return InvoiceMailService.sendEmailByInvoiceId(req.body?.invoiceIds ?? []);
  },
});
