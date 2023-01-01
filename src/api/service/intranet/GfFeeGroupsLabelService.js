'use strict';

const { GfFeegroupsLabel, GfFeegroupsLabelsXref, GfFeeGroup } =
  require('@models').intranet;

const {
  getAllEntities,
  createCatch,
  findAndGet,
  findAndUpdate,
  findAndDeleteIntranet,
} = require('@utils/request-handler');

/**
 * Your GET endpoint
 * create new FeeGroup label record
 *
 * returns Object
 **/
exports.createGfFeeGrouplabel = async function (body) {
  return await createCatch(body, GfFeegroupsLabel);
};

/**
 * Your GET endpoint
 * get all FeeGroup labels(information) record
 *
 * returns Object
 **/
exports.getGfFeegroupsLabels = async function (query) {
  return await getAllEntities(query, GfFeegroupsLabel);
};

/**
 * Your GET endpoint
 * get single FeeGroup label record by id
 *
 * id String
 * returns Object
 **/
exports.getGfFeegroupsLabelId = async function (id) {
  return await findAndGet(id, GfFeegroupsLabel); /*,
        [{
            model: GfFeegroupsLabelsXref, as: "fee_groups",
            include: { model: GfFeeGroup, as: "feeGroup", required: false }
        }]);*/
};

/**
 * Your GET endpoint
 * update single FeeGroup lable record by id
 *
 * returns Object
 **/
exports.updateGfFeegroupsLabel = async function (id, body) {
  return await findAndUpdate(id, body, GfFeegroupsLabel);
};

/**
 * Your GET endpoint
 * delete single FeeGroup label record by id
 *
 * returns Object
 **/
exports.deleteGfFeegroupsLabel = async function (id) {
  await GfFeegroupsLabelsXref.update(
    { status: 0 },
    {
      where: {
        labelId: id,
      },
    },
  );

  return await findAndDeleteIntranet(id, GfFeegroupsLabel);
};
