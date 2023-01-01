'use strict';

const {
  GfFeegroupsGroupLabel,
  GfFeegroupsGroupLabelsXref,
  GfFeeGroup,
  GfDiscountsMatrix,
} = require('@models').intranet;

const {
  getAllEntities,
  createCatch,
  findAndDeleteIntranet,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');

/**
 * Your GET endpoint
 * create new FeeGroup label record
 *
 * returns Object
 **/
exports.createGfFeegroupsGroupLabel = async function (body) {
  return await createCatch(body, GfFeegroupsGroupLabel);
};

/**
 * Your GET endpoint
 * get all FeeGroup labels(information) record
 *
 * returns Object
 **/
exports.getGfFeegroupsGroupLabels = async function (query) {
  return await getAllEntities(query, GfFeegroupsGroupLabel);
};

/**
 * Your GET endpoint
 * get single FeeGroup label record by id
 *
 * id String
 * returns Object
 **/
exports.getGfFeegroupsGroupLabelId = async function (id) {
  return await findAndGet(id, GfFeegroupsGroupLabel, [
    {
      model: GfFeegroupsGroupLabelsXref,
      as: 'fee_groups_label',
      required: false,
      include: { model: GfFeeGroup, as: 'feeGroup', required: false },
    },
    {
      model: GfDiscountsMatrix,
      as: 'discountMatrix',
      required: false,
    },
  ]);
};

/**
 * Your GET endpoint
 * update single FeeGroup lable record by id
 *
 * returns Object
 **/
exports.updateGfFeegroupsGroupLabel = async function (id, body) {
  return await findAndUpdate(id, body, GfFeegroupsGroupLabel);
};

/**
 * Your GET endpoint
 * delete single FeeGroup label record by id
 *
 * returns Object
 **/
exports.deleteGfFeegroupsGroupLabel = async function (id) {
  await GfFeegroupsGroupLabelsXref.update(
    { status: 0 },
    {
      where: {
        labelId: id,
      },
    },
  );

  return await findAndDeleteIntranet(id, GfFeegroupsGroupLabel);
};
