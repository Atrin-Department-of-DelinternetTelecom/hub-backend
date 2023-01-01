import {
  createCatch,
  findAndDelete,
  findAndDeleteIntranet,
  findAndGet,
  findAndUpdateNoInclude,
  getAllEntities,
} from '@utils/request-handler';

import ValidationException from '@lib/crud/Exceptions/ValidationException';
import { intranet } from '@models';
import niv from 'node-input-validator';

const { InvoiceClientsExtraField, InvoiceClientsExtraFieldsCategory } =
  intranet;

export const deleteInvoiceClientsExtraFieldsId = async function (id: number) {
  return findAndDelete(id, InvoiceClientsExtraField);
};

export const destroyInvoiceClientsExtraFieldsId = async function (id: number) {
  return findAndDeleteIntranet(id, InvoiceClientsExtraField);
};

export const getInvoiceClientsExtraFields = async function (
  query: Record<string, unknown>,
) {
  return getAllEntities(query, InvoiceClientsExtraField, {}, [
    {
      model: InvoiceClientsExtraFieldsCategory,
      as: 'category',
      required: false,
    },
  ]);
};

export const getInvoiceClientsExtraFieldsId = async function (id: number) {
  return findAndGet(id, InvoiceClientsExtraField);
};

export const postInvoiceClientsExtraFields = async function (
  body: Record<string, unknown>,
) {
  const validator = _validator(body);

  ValidationException.throwUnless(await validator.check(), validator.errors);

  const response = await createCatch(body, InvoiceClientsExtraField);

  return findAndGet(response.unwrap().id, InvoiceClientsExtraField);
};

export const putInvoiceClientsExtraFieldsId = async function (
  id: number,
  body: Record<string, unknown>,
) {
  const validator = _validator(body);

  ValidationException.throwUnless(await validator.check(), validator.errors);

  return findAndUpdateNoInclude(id, body, InvoiceClientsExtraField);
};

const _validator = (body: Record<string, any>) => {
  return new niv.Validator(body, {
    name: 'required',
    categoryId: 'required|existsOnIntranet:InvoiceClientsExtraFieldsCategory',
  });
};
