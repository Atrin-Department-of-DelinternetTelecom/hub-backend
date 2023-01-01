import {
  createCatch,
  findAndDelete,
  findAndDeleteIntranet,
  findAndGet,
  findAndUpdate,
  getAllEntities,
} from '@utils/request-handler';
import { downloadFile, uploadFile } from '../file/fileService';
import { respondCreated, respondSuccess } from '@utils/response';

import { File } from '@api/utils/controller-factory';
import { GfInstallationEvaluationForm } from '@api/models/intranet/intranet_gf_installation_evaluation_form';
import ValidationException from '@lib/crud/Exceptions/ValidationException';
import _ from 'lodash';
import assert from 'assert';
import niv from 'node-input-validator';

/**
 *
 * delete a category record by id
 *
 * id String
 * returns Object
 **/
export const deleteGfInstallationEvaluationFormsId = async (id: number) => {
  return findAndDelete(id, GfInstallationEvaluationForm);
};

/**
 *
 * soft delete proccess
 *
 * id String
 * returns Object
 **/
export const destroyGfInstallationEvaluationFormsId = async (id: number) => {
  return findAndDeleteIntranet(id, GfInstallationEvaluationForm);
};

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
export const getGfInstallationEvaluationForms = async (
  query: Record<string, any>,
) => {
  return getAllEntities(query, GfInstallationEvaluationForm);
};

/**
 * Your GET endpoint
 * get single category record by id
 *
 * id String
 * returns Object
 **/
export const getGfInstallationEvaluationFormsId = async (id: number) => {
  return findAndGet(id, GfInstallationEvaluationForm);
};

/**
 * Your GET endpoint
 * get single category record by id
 *
 * id String
 * returns Object
 **/
export const getByContractId = async function (contractId: number) {
  const resource = await GfInstallationEvaluationForm.findOne({
    where: { contractId: contractId },
    include: {
      all: true,
      required: false,
    },
  });
  assert(
    resource,
    `GfInstallationEvaluationForm with contractId:${contractId} was not found`,
  );

  return respondSuccess(resource.get({ plain: true }));
};

/**
 *
 * add a category record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
export const postGfInstallationEvaluationForms = async (
  body: Record<string, any>,
) => {
  const validator = _validator(body);
  ValidationException.throwUnless(await validator.check(), validator.errors);

  return createCatch(body, GfInstallationEvaluationForm);
};

/**
 *
 * update a category record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected category (optional)
 * returns Object
 **/
export const putGfInstallationEvaluationFormsId = async function (
  id: number,
  body: Record<string, any>,
) {
  const validator = _validator(body);
  ValidationException.throwUnless(await validator.check(), validator.errors);

  return findAndUpdate(id, body, GfInstallationEvaluationForm);
};

/**
 *
 * Upload form docuemnt
 *
 * docuemntFile: uploaded file
 * userId: current logged in user
 * formId: current editing form
 **/
export const downloadSignature = async (id: number) => {
  const form = await GfInstallationEvaluationForm.findByPk(id);

  assert(
    form,
    `${GfInstallationEvaluationForm.name} with id:${id} was not found`,
  );
  // get from storage
  const { data: buffer } = await downloadFile(
    form.signature,
    GfInstallationEvaluationForm.bucket,
  );

  return { buffer, filename: form.downloadName };
};

/**
 *
 * Upload form docuemnt
 *
 * docuemntFile: uploaded file
 * userId: current logged in user
 * formId: current editing form
 **/
export const uploadSignature = async function (image: File) {
  const validator = new niv.Validator(
    { image: image },
    { image: 'required|mime:jpg,png,jpeg' },
  );

  ValidationException.throwUnless(await validator.check(), validator.errors);

  const { filename } = await uploadFile(
    GfInstallationEvaluationForm.bucket,
    image,
  );

  return respondCreated({ name: filename });
};

/**
 * @returns niva.Validator
 */
function _validator(body: Record<string, any>, id?: number) {
  body.email = body.email ? body.email : null;

  return new niv.Validator(body, {
    email: 'required|email',
    formId: 'existsOnIntranet:GfContract',
  });
}
