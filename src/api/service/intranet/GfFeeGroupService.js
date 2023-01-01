'use strict';

const {
  intranet: {
    GfBonus,
    GfFeeGroup,
    GfFee,
    GfFeegroupsLabelsXref,
    GfFeegroupsGroupLabelsXref,
    GfFeegroupsSectionsXref,
    GfSection,
    GfDiscountsMatrix,
    GfFeegroupsLabel,
    GfFeegroupsGroupLabel,
    GfActiveFee,
    GfCellProvider,
  },
} = require('@models');

const {
  getAllEntities,
  findAndDeleteIntranet,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');

const {
  respondCreated,
  respondSuccess,
  respondNotFound,
} = require('../../utils/response');

const { syncMtoN } = require('../../utils/sequelize');

/**
 * Your GET endpoint
 * create new FeeGroup record
 *
 * returns Object
 **/
exports.createGfFeeGroup = async function (body) {
  const feeGroup = await GfFeeGroup.create(body);
  await syncFeeGroupXrefs(
    feeGroup.id,
    body.labels,
    body.groupLabels,
    body.sectionId,
  );
  return respondCreated(feeGroup);
};

/**
 * Your GET endpoint
 * get all FeeGroups(information) record
 *
 * returns Object
 **/
exports.getGfFeeGroups = async function (query) {
  const code = query.search?.whereQuery?.provider;
  delete query.search?.whereQuery?.provider;

  return getAllEntities(query, GfFeeGroup, undefined, [
    {
      model: GfSection,
      as: 'sections',
      required: false,
    },
    { model: GfFeegroupsLabel, as: 'labels', required: false },
    {
      model: GfDiscountsMatrix,
      as: 'group_discounts',
      required: false,
    },
    {
      model: GfFeegroupsGroupLabel,
      as: 'groupLabels',
      required: false,
    },
    {
      model: GfFee,
      as: 'gf_fees',
      required: false,
      order: [GfFee, 'id', 'DESC'],
    },
    {
      model: GfActiveFee,
      as: 'gf_active_fee',
      required: Boolean(code),
      include: [
        {
          model: GfCellProvider,
          as: 'cellProvider',
          required: Boolean(code),
          attributes: ['code'],
          where: code ? { code } : {},
        },
      ],
    },
  ]);
};

/**
 * Your GET endpoint
 * get single FeeGroup record by id
 *
 * id String
 * returns Object
 **/
exports.getGfFeeGroupsId = async function (id) {
  return findAndGet(id, GfFeeGroup);
};

/**
 * Your GET endpoint
 * update single FeeGroup record by id
 *
 * returns Object
 **/
exports.updateGfFeeGroup = async function (id, body) {
  const feeGroup = await GfFeeGroup.findByPk(id);
  if (!feeGroup) return respondNotFound(`fee group with id ${id} not found`);
  const { labels, groupLabels, sectionId } = body;
  await syncFeeGroupXrefs(id, labels, groupLabels, sectionId);
  delete body.labels;
  delete body.groupLabels;
  delete body.sectionId;
  return findAndUpdate(id, body, GfFeeGroup);
};

/**
 * sync every related xref of fee group
 * @param {number} feeGroupId id of fee group
 * @param {array<number>} labels list of label ids to sync
 * @param {array<number>} groupLabels list of label group ids to sync
 * @param {number} sectionId related section id
 */
const syncFeeGroupXrefs = async (
  feeGroupId,
  labels,
  groupLabels,
  sectionId,
) => {
  await syncMtoN(
    GfFeegroupsLabelsXref,
    'feeGroupId',
    feeGroupId,
    'labelId',
    labels,
  );

  await syncMtoN(
    GfFeegroupsGroupLabelsXref,
    'feeGroupId',
    feeGroupId,
    'labelId',
    groupLabels,
  );

  if (sectionId || sectionId === 0) {
    await syncMtoN(
      GfFeegroupsSectionsXref,
      'feeGroupId',
      feeGroupId,
      'sectionId',
      sectionId === 0 ? [] : [sectionId],
    );
  }
};

/**
 * Your GET endpoint
 * delete single FeeGroup record by id
 *
 * returns Object
 **/
exports.deleteGfFeeGroup = async function (id) {
  const feeGroup = await GfFeeGroup.findByPk(id);
  if (!feeGroup) return respondNotFound(`fee group with id ${id} not found`);
  await syncFeeGroupXrefs(id, [], [], 0);
  return findAndDeleteIntranet(id, GfFeeGroup);
};

exports.getGfFeeGroupSection = async function (id) {
  const sections = await GfFeegroupsSectionsXref.findOne({
    where: {
      feeGroupId: id,
    },
    include: [
      {
        model: GfSection,
        as: 'gf_section',
      },
    ],
  });

  return respondSuccess(sections);
};

/**
 * Get bonuses for the given feeGroup id
 *
 * id String
 * returns Object
 **/
exports.getBonuses = async function (query, id) {
  return getAllEntities(query, GfBonus, undefined, [
    {
      model: GfFeeGroup,
      as: 'feeGroups',
      required: true,
      where: {
        id: id,
      },
    },
  ]);
};

exports.getGfFeeGroupsWithFee = async function (query) {
  return getAllEntities(query, GfFeeGroup, undefined, [
    {
      model: GfFee,
      as: 'gf_fees',
      where: {
        status: 1,
      },
    },
  ]);
};

exports.getGfFeeGroupsBySection = async function (sectionId) {
  return GfFeegroupsSectionsXref.findAll({
    where: { sectionId },
    include: [
      {
        model: GfFeeGroup,
        as: 'feeGroup',
        required: true,
      },
    ],
  });
};
