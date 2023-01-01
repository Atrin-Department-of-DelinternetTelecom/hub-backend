//@ts-check
'use strict';

const { GfContract, GfContractDataTv, GfFeeGroup, GfSection } =
  require('@models').intranet;

const { respondNotFound, respondSuccess } = require('@utils/response');

const { modelToJson } = require('@utils/tools');
const { findAndUpdate, findAndGet } = require('@utils/request-handler');

const _ = require('lodash');
const GfContractSectionStatusService = require('./GfContractSectionStatusService');
const DocumentHelper = require('@service/documents/GfDocumentService');
const niv = require('node-input-validator');
const {
  default: ValidationException,
} = require('@lib/crud/Exceptions/ValidationException');

niv.extend('isContract', async ({ value }) => {
  return (await GfContract.findByPk(value)) !== null;
});

/**
 * Your GET endpoint
 * get single internet data record by id
 *
 * id String
 * returns Object
 **/
module.exports.getGfContractDataTvsId = async function getGfContractDataTvsId(
  id,
) {
  return findAndGet(id, GfContractDataTv);
};

/**
 * Your GET endpoint
 * get single internet data record by id
 *
 * id String
 * returns Object
 **/
exports.getByContractId = async function (contractId) {
  return GfContractDataTv.findOne({
    where: { contractId: contractId },
    include: [
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
        ],
      },
      {
        model: GfContract,
        as: 'internetContract',
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
        ],
      },
    ],
  }).then((model) => {
    return model === null
      ? respondNotFound(
          `${GfContractDataTv.name} with contractId:${contractId} was not found`,
        )
      : respondSuccess(modelToJson(model));
  });
};

/**
 *
 * update a internet data record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected internet data (optional)
 * returns Object
 **/
exports.putGfContractDataTvsId = async function (id, body, userId) {
  const validator = await _validator(body, id);

  ValidationException.throwUnless(await validator.check(), validator.errors);

  return findAndUpdate(id, body, GfContractDataTv).then(async (response) => {
    if (response.payload.code === 200) {
      const contractData = response.payload.data;
      const contractId = contractData.contractId;
      const section = await GfSection.scope('tv', 'defaultScope').findOne();

      // DocumentHelper.regenerateHash(response.payload.data.contractId);

      await GfContractSectionStatusService.setDoneState(
        contractId,
        section.id,
        userId,
      );
    }

    return response;
  });
};

/**
 * Create new validator instance.
 *
 * @param  object body [description]
 * @param  int|undefined id   [description]
 * @return niv.Validator
 */
function _validator(body, id) {
  body.internetContractId = body.internetContractId || null;

  return new niv.Validator(
    { id: id, ...body },
    _validationRules(body.formName, id),
    {
      isContract: `${GfContract.name} with id:${id} not found`,
    },
  );
}

/**
 * Get validation rules.
 *
 * @param  string formName
 * @param  int|undefined id
 * @return object
 */
function _validationRules() {
  return {
    internetContractId: 'required|isContract',
  };
}

exports.ensureOfDocument = async function (contract, status) {
  try {
    // create generic doc
    return await DocumentHelper.genericDocs(contract, status);
  } catch (e) {
    // statements
    console.log(e);
  }
};
