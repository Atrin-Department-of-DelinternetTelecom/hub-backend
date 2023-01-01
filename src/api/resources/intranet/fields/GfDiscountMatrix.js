//@ts-check
'use strict';
const ArrayField = require('@lib/crud/Fields/Array');
const BooleanField = require('@lib/crud/Fields/Boolean');
const DateTime = require('@lib/crud/Fields/DateTime');
const Decimal = require('@lib/crud/Fields/Decimal');
const Enum = require('@lib/crud/Fields/Enum');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');
const UID = require('@lib/crud/Fields/UID');
const { Op } = require('sequelize');
const Model = require('@models');

const { syncMtoN } = require('@api/utils/sequelize');

module.exports = class GfDiscountMatrix extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {any[]}
   */
  fields(request) {
    return [
      new ID(),

      new UID('UID', 'uid'),

      new BooleanField('Active').default(false),

      new NumberField('Fee Group', 'feeGroupId')
        .nullable()
        .default(0)
        .rules('existsOnIntranet:GfFeeGroup'),

      new NumberField('Group Label', 'feeGroupLabelId')
        .required()
        .default(0)
        .rules('existsOnIntranet:GfFeegroupsGroupLabel')
        .creationRules('required')
        .filterable()
        .sortable(),

      new TextField('Alias').required().creationRules('required').nullable(),

      new NumberField('Number of months', 'numberOfMonths')
        .default(0)
        .nullable()
        .rules('integer', 'min:0')
        .help('Set zero value to permanent discount generation'),

      new NumberField('Stay')
        .default(0)
        .nullable()
        .rules('integer', 'min:0')
        .help('Set zero value to disable'),

      new Enum('Discount Type', 'discountType')
        .required()
        .creationRules('required')
        .default('fix')
        .options({
          percentage: 'Percentage',
          fix: 'Fix',
          bono: 'Bono',
        }),

      new NumberField('Bonus', 'bonoId')
        .default(0)
        .nullable()
        .rules('requiredIf:discountType,bono', 'existsOnIntranet:GfBonus'),

      new Decimal('Discount')
        .default(0.0)
        .required()
        .rules('min:0', 'numeric', (value, attribute, fail) => {
          if (
            request.input('discountType') === 'percentage' &&
            parseFloat(value) >= 100
          ) {
            fail('Discount percentage should be less than 100.');
          }
        }),

      new NumberField('Accumulation').default(0).nullable().rules('min:0'),

      new NumberField('Order').default(0).onlyOnSequelize(),

      new TextField('ID TPV', 'idTpv')
        .default('')
        .required()
        .creationRules('required'),

      new BooleanField(
        'force Execution Target Activation',
        'forceExecutionTargetActivation',
      ).default(false),

      new BooleanField(
        'proportional Non Permanent',
        'proportionalNonPermanent',
      ).default(false),

      new NumberField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms(),

      new DateTime('Date Activation', 'dateActivation').nullable(),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),

      new ArrayField('combination Sets', 'combinationSets')
        .default([])
        .hideOnSequelize()
        .hideOnIndex()
        .typeOf('object')
        .resolveUsing(async (value, model) => {
          const {
            MatrixReplacementCombinationSet,
            MatrixReplacementCombinationRule,
            GfDiscountsMatrix,
          } = Model.intranet;
          return MatrixReplacementCombinationSet.findAll({
            where: { matrixId: model.id },
            include: [
              {
                model: MatrixReplacementCombinationRule,
                as: 'combinationSetRules',
                include: [
                  {
                    model: GfDiscountsMatrix,
                    as: 'matrix',
                  },
                ],
              },
            ],
          });
        })
        .fillUsing((request, model, attribute) => {
          return async () => {
            const combinations = request.input(attribute) ?? [];
            await syncCombinations(combinations, model.id);
          };
        })
        .nullable()
        .help(
          '[{"combinationSetId": 12, "matrixIds": [1,2,3,4]},{"matrixIds": [1,2,3,4]}]',
        ),

      new ArrayField('Exclusion')
        .default([])
        .hideOnSequelize()
        .hideOnIndex()
        .rules((value, attribute, fail) => {
          if (value.includes(request.resourceId())) {
            fail(`Invalid matrix id:${request.resourceId()}`);
          }
        })
        .resolveUsing((value, model) => {
          return model.matrixExclusion.map((matrix) => {
            return matrix.get('excludedMatrixId');
          });
        })
        .fillUsing((request, model, attribute) => {
          return async () => {
            if (request.has(attribute)) {
              const matrixId = model.get('id');
              const exclusions = request.input(attribute);
              const { GfDiscountsMatrixExclusion } = model.sequelize.models;

              await GfDiscountsMatrixExclusion.update(
                { status: 0 },
                {
                  where: {
                    excludedMatrixId: {
                      [Op.notIn]: exclusions,
                    },
                    matrixId,
                  },
                },
              );

              await Promise.all(
                exclusions.map((/** @type {number} */ excludedMatrixId) => {
                  return GfDiscountsMatrixExclusion.findOrCreate({
                    where: {
                      excludedMatrixId,
                      matrixId,
                    },
                  });
                }),
              );
            }
          };
        }),
    ];
  }
};

const syncCombinations = async (combinations, matrixId) => {
  const { MatrixReplacementCombinationSet, MatrixReplacementCombinationRule } =
    Model.intranet;

  const currentCombinationIds = [];

  const syncCombs = [];
  let combinationSetId = null;
  for (const combination of combinations) {
    combinationSetId = combination.combinationSetId;
    if (!combinationSetId)
      combinationSetId = (
        await MatrixReplacementCombinationSet.create({
          matrixId,
        })
      ).id;

    currentCombinationIds.push(combinationSetId);
    syncCombs.push(
      syncMtoN(
        MatrixReplacementCombinationRule,
        'combinationSetId',
        combinationSetId,
        'matrixId',
        combination.matrixIds,
      ),
    );
  }

  const toRemoveCombinations = await MatrixReplacementCombinationSet.findAll({
    where: {
      matrixId,
      id: { [Op.notIn]: currentCombinationIds },
    },
  });

  await MatrixReplacementCombinationSet.update(
    {
      status: 0,
    },
    {
      where: {
        matrixId,
        id: { [Op.notIn]: currentCombinationIds },
      },
    },
  );

  await MatrixReplacementCombinationRule.update(
    { status: 0 },
    {
      where: {
        combinationsetId: {
          [Op.in]: toRemoveCombinations.map((comb) => comb.id),
        },
      },
    },
  );

  await Promise.all(syncCombs);
};
