import { File, Query } from '@utils/controller-factory';
import _, { snakeCase } from 'lodash';
import { bucketName, getBucket } from '@lib/minIO';
import {
  createCatch,
  findAndDelete,
  findAndDeleteIntranet,
  findAndGet,
  findAndUpdate,
  getAllEntities,
} from '@utils/request-handler';
import {
  downloadFile as minioDownload,
  uploadFile as minioUpload,
} from '../file/fileService';

import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GfClientDocument } from '@models/intranet/intranet_gf_client_documents';
import ValidationException from '@lib/crud/Exceptions/ValidationException';
import assert from 'assert';
import niv from 'node-input-validator';
import { respondCreated } from '@api/utils/response';

/**
 *
 * delete a category record by id
 *
 * id String
 * returns Object
 **/
export const deleteGfClientDocumentsId = async function (id: number) {
  return findAndDelete(id, GfClientDocument);
};

/**
 *
 * soft delete proccess
 *
 * id String
 * returns Object
 **/
export const destroyGfClientDocumentsId = async function (id: number) {
  return findAndDeleteIntranet(id, GfClientDocument);
};

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
export const getGfClientDocuments = async function (query: Query) {
  return getAllEntities(query, GfClientDocument);
};

/**
 * Your GET endpoint
 * get single category record by id
 *
 * id String
 * returns Object
 **/
export const getGfClientDocumentsId = async function (id: number) {
  return findAndGet(id, GfClientDocument);
};

/**
 *
 * add a category record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
export const postGfClientDocuments = async function (
  body: Record<string, any>,
) {
  const validator = getValidator({ ...body });
  ValidationException.throwUnless(await validator.check(), validator.errors);

  return createCatch(body, GfClientDocument);
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
export const putGfClientDocumentsId = async function (
  id: number,
  body: Record<string, any>,
) {
  const validator = getValidator({ ...body });
  ValidationException.throwUnless(await validator.check(), validator.errors);

  return findAndUpdate(id, body, GfClientDocument);
};

/**
 *
 * Upload form docuemnt
 *
 * docuemntFile: uploaded file
 * userId: current logged in user
 * formId: current editing form
 **/
export const downloadFile = async function (id: number) {
  const document = await GfClientDocument.findByPk(id, {
    include: [
      {
        model: GfClient,
        as: 'client',
        required: true,
      },
    ],
  });
  assert(document, `${GfClientDocument.name} with id:${id} was not found`);
  // get from storage
  const { data: buffer } = await minioDownload(
    document.file,
    GfClientDocument.bucket,
  );

  return { buffer, filename: document.downloadName };
};

/**
 *
 * Upload form docuemnt
 *
 * docuemntFile: uploaded file
 * userId: current logged in user
 * formId: current editing form
 **/
export const uploadFile = async function (file: File) {
  const { filename } = await minioUpload(GfClientDocument.bucket, file);

  return respondCreated({ name: filename });
};

const getValidator = (attributes: Record<string, any>) => {
  niv.bailable(true);

  return new niv.Validator(attributes, {
    name: 'required',
    clientId: 'existsOnIntranet:GfClient',
    conceptId: 'existsOnIntranet:GfClientDocumentConcept',
  });
};
