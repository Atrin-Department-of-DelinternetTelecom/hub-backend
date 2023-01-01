// @ts-nocheck
'use strict';

const {
  intranet: {
    GfDiscountsMatrix,
    MatrixReplacementCombinationSet,
    GfDiscountsMatrixRule,
    GfFeegroupsGroupLabel,
    GfDiscountsMatrixExclusion,
    MatrixReplacementCombinationRule,
    GfFeegroupsLabelsXref,
    GfFeeGroupLabelXref,
    GfFeeGroupGroupLabel,
    GfFeeGroup,
    GfFee,
    GfSection,
    GfFeegroupsLabel,
  },
} = require('@models');

const {
  getAllEntities,
  findAndDeleteIntranet,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');

const { respondCreated, respondSuccess } = require('@utils/response');

/**
 * Your GET endpoint
 * create new Discount Matrix record
 *
 * returns Object
 **/
exports.createGfDiscountsMatrix = async function (body) {
  const matrix = await GfDiscountsMatrix.create(body);

  for (const x of body.extraFields) {
    await GfDiscountsMatrixExclusion.create({
      matrixId: matrix.id,
      excludedMatrixId: x,
    });
  }
  return respondCreated(matrix);
};

/**
 * Your GET endpoint
 * get all FeeGroup labels(information) record
 *
 * returns Object
 **/
exports.getGfDiscountsMatrix = async function (query) {
  return getAllEntities(query, GfDiscountsMatrix, undefined, [
    {
      model: MatrixReplacementCombinationSet,
      as: 'combinationSets',
      required: false,
      include: [
        {
          model: MatrixReplacementCombinationRule,
          as: 'combinationSetRules',
          required: false,
        },
      ],
    },
    {
      model: GfDiscountsMatrixExclusion,
      as: 'matrixExclusion',
      required: false,
      include: [
        {
          model: GfDiscountsMatrix,
          as: 'excludedMatrix',
          required: false,
        },
      ],
    },
    {
      model: GfFeegroupsGroupLabel,
      as: 'feeGroupLabels',
      required: false,
    },
  ]);
};

exports.getGfDiscountsAbstract = async function (query) {
  return getAllEntities(query, GfFeegroupsGroupLabel, undefined, [
    {
      model: GfDiscountsMatrix,
      attributes: ['id', 'alias'],
      as: 'discountMatrix',
      required: false,
      include: [
        {
          model: GfDiscountsMatrixRule,
          attributes: ['id', 'type'],
          as: 'matrixRule',
          required: false,
        },
        {
          model: GfDiscountsMatrixExclusion,
          as: 'matrixExclusion',
          required: false,
          include: [
            {
              model: GfDiscountsMatrix,
              as: 'excludedMatrix',
              attributes: ['id', 'alias'],
              required: false,
            },
          ],
        },
        {
          model: MatrixReplacementCombinationSet,
          as: 'combinationSets',
          required: false,
          include: [
            {
              model: MatrixReplacementCombinationRule,
              as: 'combinationSetRules',
              required: false,
            },
          ],
        },
      ],
    },
  ]);
};

exports.getGfDiscountsByfeeGroupLabel = async function (feeGroupLabelId) {
  const result = await GfDiscountsMatrix.findAll({
    where: { feeGroupLabelId },
    attributes: ['id', 'alias'],
    include: [
      {
        model: GfFeegroupsGroupLabel,
        attributes: ['id', 'name'],
        as: 'feeGroupLabels',
        required: false,
      },
    ],
  });

  return respondSuccess(result);
};

/**
 * Your GET endpoint
 * get single FeeGroup label record by id
 *
 * id String
 * returns Object
 **/
exports.getGfDiscountsMatrixId = async function (id) {
  return findAndGet(id, GfDiscountsMatrix, [
    {
      model: GfDiscountsMatrixExclusion,
      as: 'matrixExclusion',
      required: false,
      include: [
        {
          model: GfDiscountsMatrix,
          as: 'excludedMatrix',
          required: false,
        },
      ],
    },
    {
      model: GfFeegroupsGroupLabel,
      as: 'feeGroupLabels',
      required: false,
    },
    {
      model: MatrixReplacementCombinationSet,
      as: 'combinationSets',
      required: false,
      include: [
        {
          model: MatrixReplacementCombinationRule,
          as: 'combinationSetRules',
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
exports.updateGfDiscountsMatrix = async function (id, body) {
  await GfDiscountsMatrixExclusion.update(
    { status: 0 },
    { where: { matrixId: id } },
  );

  for (const x of body.extraFields) {
    await GfDiscountsMatrixExclusion.create({
      matrixId: id,
      excludedMatrixId: x,
    });
  }

  return findAndUpdate(id, body, GfDiscountsMatrix);
};

/**
 * Your GET endpoint
 * delete single FeeGroup label record by id
 *
 * returns Object
 **/
exports.deleteGfDiscountsMatrix = async function (id) {
  return findAndDeleteIntranet(id, GfDiscountsMatrix);
};

exports.getDiscountsGraph = async function (
  options = { removeInactiveMatrices: false, removeInactiveFees: false },
) {
  const { removeInactiveMatrices, removeInactiveFees } = options;

  const matrices = await GfDiscountsMatrix.findAll({
    include: [
      {
        model: GfDiscountsMatrixRule,
        as: 'matrixRule',
        required: false,
      },
      {
        model: GfDiscountsMatrixExclusion,
        as: 'matrixExclusion',
        required: false,
        include: [
          {
            model: GfDiscountsMatrix,
            as: 'excludedMatrix',
            required: false,
          },
        ],
      },
      {
        model: GfFeegroupsGroupLabel.scope(null),
        as: 'feeGroupLabels',
        required: false,
        include: [
          {
            model: GfFeeGroup.scope(null),
            as: 'feeGroups',
            required: false,
            include: [
              {
                model: GfFee.scope(null),
                as: 'gf_fees',
                required: false,
                attributes: ['id', 'baseQuote', 'tpvCode', 'status'],
              },
              {
                model: GfSection.scope(null),
                as: 'sections',
                required: false,
              },
            ],
          },
        ],
      },
    ],
  });

  // Filter inactive matrices if requested
  const filteredMatrices = removeInactiveMatrices
    ? matrices.filter((m) => m.active === 1)
    : matrices;

  const result = await Promise.all(
    filteredMatrices.map((matrix) =>
      buildMatrixGraph(matrix, removeInactiveFees),
    ),
  );

  return respondSuccess(result);
};

async function buildMatrixGraph(matrix, removeInactiveFees = false) {
  const feeGroupLabels = matrix.feeGroupLabels
    ? [
        {
          id: matrix.feeGroupLabels.id,
          name: matrix.feeGroupLabels.name,
          feeGroups: (matrix.feeGroupLabels.feeGroups || []).map((group) => ({
            feeGroupId: group.id,
            feeGroupName: group.name,
            active: group.active,
            section: group.sections?.[0]?.name ?? null,
            baseQuotes: (group.gf_fees || [])
              .filter((fee) => !removeInactiveFees || fee.status === 1)
              .map((fee) => ({
                feeId: fee.id,
                baseQuote: fee.baseQuote ?? null,
                tpvCode: fee.tpvCode ?? null,
                active: fee.status ?? null,
              })),
          })),
        },
      ]
    : [];

  return {
    matrixId: matrix.id,
    matrixName: matrix.alias,
    accumulation: matrix.accumulation,
    stay: matrix.stay,
    numberOfMonths: matrix.numberOfMonths,
    discountType: matrix.discountType,
    discount: matrix.discount,
    active: matrix.active,
    feeGroupLabels: feeGroupLabels,
    actors: await Promise.all(
      (matrix.matrixRule || []).map((rule) =>
        buildActor(rule, removeInactiveFees),
      ),
    ),
    exclusions: (matrix.matrixExclusion || []).map((exclusion) => ({
      excludedMatrixId: exclusion.excludedMatrixId,
      excludedMatrixName: exclusion.excludedMatrix?.alias ?? null,
    })),
  };
}

// Build actors response
async function buildActor(rule, removeInactiveFees = false) {
  if (rule.type === 'labeled_contract_present') {
    const label = await GfFeegroupsLabel.findByPk(rule.presentLabelId);

    let feeGroups = [];
    if (label) {
      const labelXrefs = await GfFeegroupsLabelsXref.findAll({
        where: { labelId: label.id },
        include: [
          {
            model: GfFeeGroup,
            as: 'feeGroup',
            include: [
              {
                model: GfFee.scope(null),
                as: 'gf_fees',
                required: false,
                attributes: ['id', 'baseQuote', 'tpvCode', 'status'],
              },
              {
                model: GfSection.scope(null),
                as: 'sections',
                required: false,
              },
            ],
          },
        ],
      });

      feeGroups = labelXrefs.map((xref) => ({
        feeGroupId: xref.feeGroup?.id ?? null,
        feeGroupName: xref.feeGroup?.name ?? null,
        active: xref.feeGroup?.active ?? null,
        section: xref.feeGroup?.sections?.[0]?.name ?? null,
        baseQuotes: (xref.feeGroup?.gf_fees || [])
          .filter((fee) => !removeInactiveFees || fee.active === 1)
          .map((fee) => ({
            feeId: fee.id,
            baseQuote: fee.baseQuote ?? null,
            tpvCode: fee.tpvCode ?? null,
            active: fee.status ?? null,
          })),
      }));
    }

    return {
      ruleId: rule.id,
      type: rule.type,
      labelId: label?.id ?? null,
      labelName: label?.name ?? null,
      feeGroups: feeGroups,
    };
  } else if (rule.type === 'discount_present') {
    const dependentMatrix = await GfDiscountsMatrix.findByPk(
      rule.presentMatrixId,
    );
    return {
      ruleId: rule.id,
      type: rule.type,
      matrixId: dependentMatrix?.id ?? null,
      matrixName: dependentMatrix?.alias ?? null,
      active: dependentMatrix?.active ?? null,
    };
  }

  return {
    ruleId: rule.id,
    type: rule.type,
  };
}
