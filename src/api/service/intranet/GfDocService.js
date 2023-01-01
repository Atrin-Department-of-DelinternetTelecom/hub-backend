'use strict';

const {
  intranet: {
    DocStatus,
    GfClient,
    GfContract,
    GfContractDataCell,
    GfContractDataTv,
    GfContractDataFix,
    GfContractDataInternet,
    GfFeeGroup,
    GfSection,
  },
} = require('@models');
const { GfDoc } = require('@models/intranet/intranet_gf_docs');
const {
  findAndGet,
  findAndUpdate,
  findAndDelete,
  findAndDeleteIntranet,
  getAllEntities,
} = require('@utils/request-handler');
const { Op } = require('sequelize');

/**
 *
 * delete a category record by id
 *
 * id String
 * returns Object
 **/
exports.deleteGfDocsId = async function (id) {
  return await findAndDelete(id, GfDoc);
};

/**
 *
 * soft delete proccess
 *
 * id String
 * returns Object
 **/
exports.destroyGfDocsId = async function (id) {
  return await findAndDeleteIntranet(id, GfDoc);
};

/**
 * Your GET endpoint
 * get all categories(information) record
 *
 * returns Object
 **/
exports.getGfDocs = async function (query) {
  const contractDocs = await getAllEntities(query, GfDoc, undefined, [
    {
      model: DocStatus,
      as: 'statuses',
      required: true,
    },
    {
      model: GfContract,
      as: 'contract',
      required: true,
      where: {
        state: {
          [Op.notIn]: ['suspended'],
        },
      },
      include: [
        {
          model: GfFeeGroup,
          as: 'fee_group',
          include: {
            model: GfSection,
            as: 'sections',
            required: false,
          },
          required: false,
        },
        {
          model: GfContractDataCell,
          as: 'dataCell',
          required: false,
        },
        {
          model: GfContractDataTv,
          as: 'dataTv',
          required: false,
        },
        {
          model: GfContractDataFix,
          as: 'dataFix',
          required: false,
          include: [
            {
              model: GfContractDataInternet,
              as: 'dataInternet',
              required: false,
            },
          ],
        },
        {
          model: GfContractDataInternet,
          as: 'dataInternet',
          required: false,
          include: [
            {
              model: GfContractDataFix,
              as: 'dataFixes',
              required: false,
            },
          ],
        },
      ],
    },
    {
      model: GfClient,
      as: 'client',
    },
  ]);

  const customWhere = {
    contractId: -1,
    id: {
      [Op.notIn]: contractDocs.payload.data.map((doc) => doc.id),
    },
  };
  if (query.search?.whereQuery['$contract.clientId$']) {
    customWhere.clientId = query.search.whereQuery['$contract.clientId$'];
    delete query.search.whereQuery['$contract.clientId$'];
  }

  query.limit = query.size - contractDocs.payload.data.length;
  query.page -= Math.ceil(contractDocs.payload.meta.total / query.size);
  query.offset =
    (query.page - 1) * query.size +
    (contractDocs.payload.meta.total % query.size);

  if (query.offset < 0) query.offset = 0;

  const clientDocs = await getAllEntities(query, GfDoc, customWhere, [
    {
      model: DocStatus,
      as: 'statuses',
      required: true,
    },
    {
      model: GfContract,
      as: 'contract',
      required: false,
      include: [
        {
          model: GfFeeGroup,
          as: 'fee_group',
          include: {
            model: GfSection,
            as: 'sections',
            required: false,
          },
          required: false,
        },
        {
          model: GfContractDataCell,
          as: 'dataCell',
          required: false,
        },
        {
          model: GfContractDataTv,
          as: 'dataTv',
          required: false,
        },
        {
          model: GfContractDataFix,
          as: 'dataFix',
          required: false,
          include: [
            {
              model: GfContractDataInternet,
              as: 'dataInternet',
              required: false,
            },
          ],
        },
        {
          model: GfContractDataInternet,
          as: 'dataInternet',
          required: false,
          include: [
            {
              model: GfContractDataFix,
              as: 'dataFixes',
              required: false,
            },
          ],
        },
      ],
    },
    {
      model: GfClient,
      as: 'client',
      required: true,
    },
  ]);

  contractDocs.payload.data = clientDocs.payload.data
    .concat(contractDocs.payload.data)
    .sort((a, b) => (a.id <= b.id ? -1 : 1));

  contractDocs.payload.meta.total += clientDocs.payload.meta.total;

  contractDocs.payload.data = contractDocs.payload.data.map((d) => {
    d = d.get({ plain: true });
    d.statuses = d.statuses.map((s) => {
      // s = s.get({ plain: true });
      return {
        ...s,
        signed: s.signed ? 1 : 0,
        baseDataComplete: s.baseDataComplete ? 1 : 0,
      };
    });
    return d;
  });

  return contractDocs;
};

/**
 * Your GET endpoint
 * get single category record by id
 *
 * id String
 * returns Object
 **/
exports.getGfDocsId = async function (id) {
  return await findAndGet(id, GfDoc);
};

/**
 *
 * add a category record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
// exports.postGfDocs = async function (body) {
//   return createCatch(body, GfDoc).then(async (response) => {
//     if (response.code === 201) await exports.syncInvoice(response.payload.data);

//     return response;
//   });
// };

/**
 *
 * update a category record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected category (optional)
 * returns Object
 **/
exports.putGfDocsId = async function (id, body) {
  return findAndUpdate(id, body, GfDoc);
};

exports.getSignature = async function (id, body, userId) {
  throw new Error('not supported');
};

/**
 *
 * Upload form docuemnt
 *
 * docuemntFile: uploaded file
 * userId: current logged in user
 * formId: current editing form
 **/
exports.uploadSignedDocument = async function (id, document, userId) {
  throw new Error('not supported');
};

/**
 *
 * Upload form docuemnt
 *
 * docuemntFile: uploaded file
 * userId: current logged in user
 * formId: current editing form
 **/
exports.toggleSigned = async function (id, signed, userId) {
  throw new Error('Not supported');
};

/**
 *
 * Upload form old docuemnt
 *
 * docuemntFile: uploaded file
 * userId: current logged in user
 * formId: current editing form
 **/
exports.uploadOldDocument = async function (id, documentId, userId) {
  throw new Error('not supported');
};
