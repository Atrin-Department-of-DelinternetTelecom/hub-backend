'use strict';

const {
  GfDiscountsMatrixRule,
  GfDiscountsMatrix,
  GfFeegroupsLabel,
  GfFeegroupsGroupLabel,
  GfBonoLabel,
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
exports.createGfDiscountsMatrixRule = async function (body) {
  return createCatch(body, GfDiscountsMatrixRule);
};

/**
 * Your GET endpoint
 * get all FeeGroup labels(information) record
 *
 * returns Object
 **/
exports.getGfDiscountsMatrixRules = async function (query) {
  return getAllEntities(query, GfDiscountsMatrixRule, undefined, [
    {
      model: GfDiscountsMatrix,
      as: 'presentMatrix',
      required: false,
      attributes: ['id', 'alias'],
      include: [
        {
          model: GfFeegroupsGroupLabel,
          attributes: ['id', 'name'],
          as: 'feeGroupLabels',
          required: false,
        },
      ],
    },
    {
      model: GfFeegroupsLabel,
      as: 'feegroupsLabel',
      required: false,
    },
    {
      model: GfBonoLabel,
      as: 'bonoLabel',
      required: false,
    },
  ]);
};

/**
 * Your GET endpoint
 * get single FeeGroup label record by id
 *
 * id String
 * returns Object
 **/
exports.getGfDiscountsMatrixRuleId = async function (id) {
  return findAndGet(id, GfDiscountsMatrixRule, [
    {
      model: GfFeegroupsLabel,
      as: 'feegroupsLabel',
      required: false,
    },
    {
      model: GfBonoLabel,
      as: 'bonoLabel',
      required: false,
    },
    {
      model: GfDiscountsMatrix,
      as: 'presentMatrix',
      required: false,
      attributes: ['id', 'alias'],
      include: [
        {
          model: GfFeegroupsGroupLabel,
          attributes: ['id', 'name'],
          as: 'feeGroupLabels',
          required: false,
        },
      ],
    },
  ]);
};

/**
 * Your GET endpoint
 * update single FeeGroup lable record by id
 *
 * returns Object
 **/
exports.updateGfDiscountsMatrixRule = async function (id, body) {
  return findAndUpdate(id, body, GfDiscountsMatrixRule);
};

/**
 * Your GET endpoint
 * delete single FeeGroup label record by id
 *
 * returns Object
 **/
exports.deleteGfDiscountsMatrixRule = async function (id) {
  return findAndDeleteIntranet(id, GfDiscountsMatrixRule);
};
