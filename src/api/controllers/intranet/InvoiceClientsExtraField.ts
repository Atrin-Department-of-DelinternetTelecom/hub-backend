import {
  getInvoiceClientsExtraFields as all,
  postInvoiceClientsExtraFields as create,
  destroyInvoiceClientsExtraFieldsId as destroy,
  getInvoiceClientsExtraFieldsId as find,
  putInvoiceClientsExtraFieldsId as update,
} from '@service/intranet/InvoiceClientsExtraFieldService';

import { createRoute } from '@api/utils/controller-factory';

export const deleteInvoiceClientsExtraFieldsId = createRoute({
  handler: async (req) => destroy(req.swagger.params.id.value),
});

export const getInvoiceClientsExtraFields = createRoute({
  handler: async (req) => {
    return all({
      ...req.query,
      url:
        req.protocol +
        '://' +
        req.get('host') +
        req.url.slice(0, req.url.indexOf('?')),
    });
  },
});

export const getInvoiceClientsExtraFieldsId = createRoute({
  handler: async (req) => find(req.swagger.params.id.value),
});

export const postInvoiceClientsExtraFields = createRoute({
  handler: async (req) => create(req.swagger.params.body.value),
});

export const putInvoiceClientsExtraFieldsId = createRoute({
  handler: async (req) => {
    return update(req.swagger.params.id.value, req.swagger.params.body.value);
  },
});
