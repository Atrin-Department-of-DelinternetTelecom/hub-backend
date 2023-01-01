import {
  getInvoiceClientsExtraFieldsCategories as all,
  postInvoiceClientsExtraFieldsCategories as create,
  destroyInvoiceClientsExtraFieldsCategoriesId as destroy,
  getInvoiceClientsExtraFieldsCategoriesId as find,
  putInvoiceClientsExtraFieldsCategoriesId as update,
} from '@api/service/intranet/InvoiceClientsExtraFieldsCategoryService';

import { createRoute } from '@api/utils/controller-factory';

export const getInvoiceClientsExtraFieldsCategories = createRoute({
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

export const getInvoiceClientsExtraFieldsCategoriesId = createRoute({
  handler: async (req) => find(req.swagger.params.id.value),
});

export const postInvoiceClientsExtraFieldsCategories = createRoute({
  handler: async (req) => create(req.swagger.params.body.value),
});

export const putInvoiceClientsExtraFieldsCategoriesId = createRoute({
  handler: async (req) =>
    update(req.swagger.params.id.value, req.swagger.params.body.value),
});

export const deleteInvoiceClientsExtraFieldsCategoriesId = createRoute({
  handler: async (req) => destroy(req.swagger.params.id.value),
});
