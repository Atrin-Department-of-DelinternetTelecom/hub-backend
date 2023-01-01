import {
  createCatch,
  findAndDelete,
  findAndDeleteIntranet,
  findAndGet,
  findAndUpdate,
  getAllEntities,
} from '@api/utils/request-handler';

import ValidationException from '@lib/crud/Exceptions/ValidationException';
import { intranet } from '@api/models';
import niv from 'node-input-validator';

const { InvoiceClientsExtraFieldsCategory } = intranet;

export const deleteInvoiceClientsExtraFieldsCategoriesId = async (
  id: number,
) => {
  return findAndDelete(id, InvoiceClientsExtraFieldsCategory);
};

export const destroyInvoiceClientsExtraFieldsCategoriesId = async (
  id: number,
) => {
  return findAndDeleteIntranet(id, InvoiceClientsExtraFieldsCategory);
};

export const getInvoiceClientsExtraFieldsCategories = async (
  query: Record<string, unknown>,
) => {
  return getAllEntities(query, InvoiceClientsExtraFieldsCategory);
};

export const getInvoiceClientsExtraFieldsCategoriesId = async (id: number) => {
  return findAndGet(id, InvoiceClientsExtraFieldsCategory);
};

export const postInvoiceClientsExtraFieldsCategories = async (
  body: Record<string, unknown>,
) => {
  const validator = _validator(body);

  ValidationException.throwUnless(await validator.check(), validator.errors);

  return createCatch(body, InvoiceClientsExtraFieldsCategory);
};

export const putInvoiceClientsExtraFieldsCategoriesId = async (
  id: number,
  body: Record<string, unknown>,
) => {
  const validator = _validator(body);
  ValidationException.throwUnless(await validator.check(), validator.errors);

  return findAndUpdate(id, body, InvoiceClientsExtraFieldsCategory);
};

const _validator = (body: Record<string, unknown>) => {
  return new niv.Validator(body, { name: 'required' });
};
