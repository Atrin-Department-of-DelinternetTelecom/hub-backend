const {
  intranet,
  allModels: {
    GfContract,
    GfDiscountsExecuted,
    GfDiscountsMatrixExclusion,
    GfDiscountsMatrix,
    GfDiscountsMatrixRule,
    GfDiscountsPending,
    GfDiscountsScheduled,
    GfFeeGroup,
    GfFeegroupsGroupLabel,
    GfFeegroupsGroupLabelsXref,
    GfFeegroupsLabel,
    GfFeegroupsLabelsXref,
  },
} = require('@models');

const GfContractService = require('@service/intranet/GfContractService');
const GfDiscountsPendingService = require('@service/intranet/GfDiscountsPendingService');
const { Manager } = require('@lib/cache');
const moment = require('moment');

beforeEach(async () => {
  await Promise.all([
    GfContract.destroy({ truncate: true, cascade: true }),
    GfDiscountsExecuted.destroy({ truncate: true, cascade: true }),
    GfDiscountsMatrix.destroy({ truncate: true, cascade: true }),
    GfDiscountsMatrixExclusion.destroy({ truncate: true, cascade: true }),
    GfDiscountsMatrixRule.destroy({ truncate: true, cascade: true }),
    GfDiscountsPending.destroy({ truncate: true, cascade: true }),
    GfDiscountsScheduled.destroy({ truncate: true, cascade: true }),
    GfFeeGroup.destroy({ truncate: true, cascade: true }),
    GfFeegroupsGroupLabel.destroy({ truncate: true, cascade: true }),
    GfFeegroupsLabel.destroy({ truncate: true, cascade: true }),
    GfFeegroupsLabelsXref.destroy({ truncate: true, cascade: true }),
  ]);

  // Reset identity counters (optional, for MySQL/Postgres)
  await intranet.sequelize.query(
    'ALTER TABLE gf_discounts_matrix_exclusions AUTO_INCREMENT = 1',
  );

  // Clean caches
  await Promise.all([
    Manager.driver('static').forget(
      'GfDiscountsPendingService.getExclusionRows',
    ),
    Manager.driver('static').forget('GfDiscountsPendingService.checkRules'),
  ]);
});

jest.setTimeout(5 * 60 * 1000);

describe('Positive Tests', () => {
  describe('Positive test on `getExclusionRows`', () => {
    it('should group by unique matrixId', async () => {
      await Promise.all([
        GfDiscountsMatrixExclusion.create({ id: 1, matrixId: 1 }),
        GfDiscountsMatrixExclusion.create({ id: 2, matrixId: 2 }),
      ]);

      const exclusions = await GfDiscountsPendingService.getExclusionRows();

      expect(Object.keys(exclusions)).toEqual(
        expect.arrayContaining(['1', '2']),
      );
      expect(exclusions['1']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 1, matrixId: 1 }),
        ]),
      );
      expect(exclusions['2']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 2, matrixId: 2 }),
        ]),
      );
    });

    it('should group by non-unique matrixId', async () => {
      await Promise.all([
        GfDiscountsMatrixExclusion.create({ id: 101, matrixId: 10 }),
        GfDiscountsMatrixExclusion.create({ id: 102, matrixId: 20 }),
        GfDiscountsMatrixExclusion.create({ id: 103, matrixId: 20 }),
      ]);

      const exclusions = await GfDiscountsPendingService.getExclusionRows();

      expect(Object.keys(exclusions)).toEqual(
        expect.arrayContaining(['10', '20']),
      );
      expect(exclusions['10']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 101, matrixId: 10 }),
        ]),
      );
      expect(exclusions['20']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 102, matrixId: 20 }),
          expect.objectContaining({ id: 103, matrixId: 20 }),
        ]),
      );
    });
  });

  describe('Positive test on `getExcludedFromExecuteds`', () => {
    it('have to group `gf-discount-matrix-exclusion` by unique matrixId', async () => {
      const targetContractId = 100;
      await Promise.all([
        GfDiscountsExecuted.create({
          id: 1,
          targetContractId,
          matrixId: 1,
        }),
        GfDiscountsExecuted.create({
          id: 2,
          targetContractId,
          matrixId: 2,
        }),
      ]);

      const exceluds = await GfDiscountsPendingService.getExcludedFromExecuteds(
        targetContractId,
      );

      expect(exceluds).toMatchObject([1, 2]);
    });
  });

  describe('Positive test on `hasIncompatibility`', () => {
    it('have to return `true` if `gf-discount-matrix-exclusion` has been executed', async () => {
      const targetContractId = 100;
      await Promise.all([
        GfDiscountsMatrixExclusion.create({
          matrixId: 1,
          excludedMatrixId: 2,
        }),
        GfDiscountsExecuted.create({
          id: 1,
          targetContractId,
          matrixId: 2,
        }),
      ]);

      expect(
        await GfDiscountsPendingService.hasIncompatibility(targetContractId, 1),
      ).toBeTruthy();
    });
  });

  describe('Positive test on `checkRule`', () => {
    it('should return executed for Rule of type `discount_present` by target contract', async () => {
      const today = moment();

      const contract = await GfContract.create({
        dateActivation: today.toDate(),
      });

      const rule = await GfDiscountsMatrixRule.create({
        type: 'discount_present',
        presentMatrixId: 1,
        maxDaysTargetExists: 90,
      });

      await GfDiscountsExecuted.create({
        active: 1,
        targetContractId: contract.id,
        matrixId: 1,
      });

      const executed = await GfDiscountsPendingService.checkRule(
        rule,
        [contract],
        contract,
      );

      expect(executed).toMatchObject([{ type: 'matrix', typeId: 1 }]);
    });

    it('should return array of executed for Rule of type `discount_present` by other contracts', async () => {
      const [targetContract, otherContract] = await Promise.all([
        GfContract.create({}),
        GfContract.create({}),
      ]);

      const rule = await GfDiscountsMatrixRule.create({
        type: 'discount_present',
        presentMatrixId: 1,
      });

      await GfDiscountsExecuted.create({
        active: 1,
        targetContractId: targetContract.id,
        matrixId: 1,
      });

      const executed = await GfDiscountsPendingService.checkRule(
        rule,
        [targetContract],
        otherContract,
      );

      expect(executed).toMatchObject([{ type: 'matrix', typeId: 1 }]);
    });

    it('should return array of executed for Rule of type `labeled_contract_present`', async () => {
      const contract = await GfContract.create({ clientId: 1, feeGroupId: 1 });

      const matrix = await GfDiscountsMatrix.create({});

      const label = await GfFeegroupsLabel.create({ contractId: contract.id });

      await GfFeegroupsLabelsXref.create({
        feeGroupId: contract.feeGroupId,
        labelId: label.id,
      });

      const rule = await GfDiscountsMatrixRule.create({
        type: 'labeled_contract_present',
        presentLabelId: label.id,
        matrixId: matrix.id,
      });

      const executed = await GfDiscountsPendingService.checkRule(
        rule,
        [await GfContractService.hydrateContract(contract)],
        contract,
      );

      expect(executed).toMatchObject([
        {
          matrixId: 1,
          type: 'contract',
          typeId: contract.id,
        },
      ]);
    });
  });

  describe('Positive test on `checkRules`', () => {
    it('should return array of executed', async () => {
      const contract = await GfContract.create({
        clientId: 1,
        feeGroupId: 1,
      });

      const label = await GfFeegroupsLabel.create({ contractId: contract.id });

      await GfFeegroupsLabelsXref.create({
        feeGroupId: contract.feeGroupId,
        labelId: label.id,
      });

      const matrix = await GfDiscountsMatrix.create({ active: 1 });

      const rule = await GfDiscountsMatrixRule.create({
        type: 'labeled_contract_present',
        presentLabelId: label.id,
        matrixId: matrix.id,
      });

      const hydrated = await GfContractService.hydrateContract(contract);

      const executed = await GfDiscountsPendingService.checkRules(
        matrix,
        [hydrated],
        contract,
      );

      expect(executed).toMatchObject([
        {
          possibles: [
            {
              matrixId: matrix.id,
              type: 'contract',
              typeId: contract.id,
            },
          ],
        },
      ]);
    });
  });

  describe('Positive test on `hasDiscountsPending`', () => {
    it('have to return array of possibles', async () => {
      const feeGroupId = 1;
      const feeGroupLabelId = 1;
      await Promise.allSettled([
        GfFeeGroup.create({ id: feeGroupId }),
        GfContract.create({ id: 1, clientId: 1, feeGroupId }),
        GfFeegroupsGroupLabel.create({ id: feeGroupLabelId, feeGroupId }),
        GfFeegroupsLabel.create({ id: 1, contractId: 1 }),
        GfFeegroupsGroupLabelsXref.create({ labelId: 1, feeGroupId }),
        GfFeegroupsLabelsXref.create({ id: 1, feeGroupId, labelId: 1 }),
        GfDiscountsMatrix.create({
          id: 1,
          active: 1,
          feeGroupLabelId,
          feeGroupId,
        }),
        GfDiscountsMatrixRule.create({
          id: 1,
          type: 'labeled_contract_present',
          presentLabelId: 1,
          matrixId: 1,
        }),
      ]);
      const contract = await GfContractService.hydrateContract(
        await GfContract.findByPk(1),
      );
      const possibles = await GfDiscountsPendingService.hasDiscountsPending(
        contract,
        [contract],
      );

      expect(possibles).toMatchObject({
        exclusionReasons: [],
        pending: [
          {
            contractId: 1,
            matrix: { id: 1 },
            rules: [
              {
                id: 1,
                possibles: [
                  {
                    matrixId: 1,
                    type: 'contract',
                    typeId: 1,
                  },
                ],
              },
            ],
          },
        ],
      });
    });
  });

  describe('Positive test on `getPossibleFromClient`', () => {
    it('have to return array of possibles for specifc matrix id', async () => {
      const feeGroupId = 1;
      const feeGroupLabelId = 1;
      const clientId = 1;
      const targetDate = moment();
      await Promise.allSettled([
        GfFeeGroup.create({ id: feeGroupId }),
        GfContract.create({
          id: 1,
          state: 'active',
          dateActivation: targetDate.subtract(1, 'days').format('YYYY-MM-DD'),
          clientId,
          feeGroupId,
        }),
        GfFeegroupsGroupLabel.create({ id: feeGroupLabelId, feeGroupId }),
        GfFeegroupsLabel.create({ id: 1, contractId: 1 }),
        GfFeegroupsGroupLabelsXref.create({ labelId: 1, feeGroupId }),
        GfFeegroupsLabelsXref.create({ id: 1, feeGroupId, labelId: 1 }),
        GfDiscountsMatrix.create({
          id: 1,
          active: 1,
          alias: 'test by client id',
          feeGroupLabelId,
          feeGroupId,
        }),
        GfDiscountsMatrixRule.create({
          id: 1,
          type: 'labeled_contract_present',
          presentLabelId: 1,
          matrixId: 1,
        }),
      ]);
      const { pendings, possibles, exclusionReasons } =
        await GfDiscountsPendingService.getPossibleFromClient(
          clientId,
          targetDate,
          1,
        );

      expect(exclusionReasons).toMatchObject({ 1: [] });
      expect(pendings).toMatchObject([
        {
          base: { contractId: 1, matrixId: 1, alias: 'test by client id' },
          used: [
            {
              matrixId: 1,
              ruleId: 1,
              type: 'contract',
              typeId: 1,
            },
          ],
          pendingId: undefined,
          ambiguous: false,
          key: '1:1:false:contract1',
        },
      ]);
      expect(possibles).toMatchObject([
        {
          exclusionReasons: {
            1: [],
          },
          pending: [
            {
              contractId: 1,
              matrix: { id: 1, alias: 'test by client id' },
              rules: [
                {
                  id: 1,
                  possibles: [
                    {
                      matrixId: 1,
                      type: 'contract',
                      typeId: 1,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]);
    });

    it('have to return array of all possibles', async () => {
      const feeGroupId = 1;
      const feeGroupLabelId = 1;
      const clientId = 1;
      const targetDate = moment();
      await Promise.allSettled([
        GfFeeGroup.create({ id: feeGroupId }),
        GfContract.create({
          id: 1,
          state: 'active',
          dateActivation: targetDate.subtract(1, 'days').format('YYYY-MM-DD'),
          clientId,
          feeGroupId,
        }),
        GfFeegroupsGroupLabel.create({ id: feeGroupLabelId, feeGroupId }),
        GfFeegroupsLabel.create({ id: 1, contractId: 1 }),
        GfFeegroupsGroupLabelsXref.create({ labelId: 1, feeGroupId }),
        GfFeegroupsLabelsXref.create({ id: 1, feeGroupId, labelId: 1 }),
        GfDiscountsMatrix.create({
          id: 1,
          active: 1,
          alias: 'test by client id',
          feeGroupLabelId,
          feeGroupId,
        }),

        GfDiscountsMatrix.create({
          id: 2,
          active: 1,
          alias: 'test by client id 2',
          feeGroupLabelId,
          feeGroupId,
        }),

        GfDiscountsMatrixRule.create({
          id: 1,
          type: 'labeled_contract_present',
          presentLabelId: 1,
          matrixId: 1,
        }),

        GfDiscountsMatrixRule.create({
          id: 2,
          type: 'labeled_contract_present',
          presentLabelId: 1,
          matrixId: 2,
        }),
      ]);
      const { pendings, possibles, exclusionReasons } =
        await GfDiscountsPendingService.getPossibleFromClient(clientId);

      expect(exclusionReasons).toMatchObject({ 1: [] });
      expect(pendings.length).toBe(2);

      expect(
        pendings.sort((a, b) => (a.matrixId > b.matrixId ? 1 : -1)),
      ).toEqual(
        expect.arrayContaining([
          {
            base: { contractId: 1, matrixId: 1, alias: 'test by client id' },
            used: [
              {
                matrixId: 1,
                ruleId: 1,
                type: 'contract',
                typeId: 1,
              },
            ],
            pendingId: undefined,
            ambiguous: true,
            key: '1:1:true:contract1',
          },
          {
            base: { contractId: 1, matrixId: 2, alias: 'test by client id 2' },
            used: [
              {
                matrixId: 2,
                ruleId: 2,
                type: 'contract',
                typeId: 1,
              },
            ],
            pendingId: undefined,
            ambiguous: true,
            key: '1:2:true:contract1',
          },
        ]),
      );

      expect(possibles.length).toBe(1);

      expect(
        possibles[0].pending.sort((a, b) =>
          a.matrix.id > b.matrix.id ? 1 : -1,
        ),
      ).toMatchObject([
        {
          contractId: 1,
          matrix: { id: 1, alias: 'test by client id' },
          rules: [
            {
              id: 1,
              possibles: [
                {
                  matrixId: 1,
                  type: 'contract',
                  typeId: 1,
                },
              ],
            },
          ],
        },
        {
          contractId: 1,
          matrix: { id: 2, alias: 'test by client id 2' },
          rules: [
            {
              id: 2,
              possibles: [
                {
                  matrixId: 2,
                  type: 'contract',
                  typeId: 1,
                },
              ],
            },
          ],
        },
      ]);
    });
  });

  describe('Positive test on `updateDiscountsPending`', () => {
    it('have to return array of possibles for specifc matrix id', async () => {
      const feeGroupId = 1;
      const feeGroupLabelId = 1;
      const clientId = 1;
      const targetDate = moment();
      await Promise.allSettled([
        GfFeeGroup.create({ id: feeGroupId }),
        GfContract.create({
          id: 1,
          state: 'active',
          dateActivation: targetDate.subtract(1, 'days').format('YYYY-MM-DD'),
          clientId,
          feeGroupId,
        }),
        GfFeegroupsGroupLabel.create({ id: feeGroupLabelId, feeGroupId }),
        GfFeegroupsLabel.create({ id: 1, contractId: 1 }),
        GfFeegroupsGroupLabelsXref.create({ labelId: 1, feeGroupId }),
        GfFeegroupsLabelsXref.create({ id: 1, feeGroupId, labelId: 1 }),
        GfDiscountsMatrix.create({
          id: 1,
          active: 1,
          alias: 'test by client id',
          feeGroupLabelId,
          feeGroupId,
        }),
        GfDiscountsMatrixRule.create({
          id: 1,
          type: 'labeled_contract_present',
          presentLabelId: 1,
          matrixId: 1,
        }),
      ]);

      await GfDiscountsPendingService.updateDiscountsPending(clientId, 1);

      const pendings = await GfDiscountsPending.findAll();

      expect(pendings.length).toBe(1);
      expect(pendings).toMatchObject([
        {
          clientId: 1,
          contractId: 1,
          matrixId: 1,
          ambiguos: 0,
          key: '1:1:false:contract1',
          used: '[{"type":"contract","typeId":1,"matrixId":1,"ruleId":1}]',
        },
      ]);
    });

    it('have to return array of all possibles', async () => {
      const feeGroupId = 1;
      const feeGroupLabelId = 1;
      const clientId = 1;
      const targetDate = moment();
      await Promise.allSettled([
        GfFeeGroup.create({ id: feeGroupId }),
        GfContract.create({
          id: 1,
          state: 'active',
          dateActivation: targetDate.subtract(1, 'days').format('YYYY-MM-DD'),
          clientId,
          feeGroupId,
        }),
        GfFeegroupsGroupLabel.create({ id: feeGroupLabelId, feeGroupId }),
        GfFeegroupsLabel.create({ id: 1, contractId: 1 }),
        GfFeegroupsGroupLabelsXref.create({ labelId: 1, feeGroupId }),
        GfFeegroupsLabelsXref.create({ id: 1, feeGroupId, labelId: 1 }),
        GfDiscountsMatrix.create({
          id: 1,
          active: 1,
          alias: 'test by client id',
          feeGroupLabelId,
          feeGroupId,
        }),

        GfDiscountsMatrix.create({
          id: 2,
          active: 1,
          alias: 'test by client id 2',
          feeGroupLabelId,
          feeGroupId,
        }),

        GfDiscountsMatrixRule.create({
          id: 1,
          type: 'labeled_contract_present',
          presentLabelId: 1,
          matrixId: 1,
        }),

        GfDiscountsMatrixRule.create({
          id: 2,
          type: 'labeled_contract_present',
          presentLabelId: 1,
          matrixId: 2,
        }),
      ]);

      await GfDiscountsPendingService.updateDiscountsPending(clientId);

      const pendings = await GfDiscountsPending.findAll();

      expect(pendings.length).toBe(2);
      expect(
        pendings.sort((a, b) => (a.matrixId > b.matrixId ? 1 : -1)),
      ).toMatchObject([
        {
          clientId: 1,
          contractId: 1,
          matrixId: 1,
          ambiguos: 1,
          key: '1:1:true:contract1',
          used: '[{"type":"contract","typeId":1,"matrixId":1,"ruleId":1}]',
        },
        {
          clientId: 1,
          contractId: 1,
          matrixId: 2,
          ambiguos: 1,
          key: '1:2:true:contract1',
          used: '[{"type":"contract","typeId":1,"matrixId":2,"ruleId":2}]',
        },
      ]);
    });
  });

  describe('Positive test on `updateAllFromClient`', () => {
    it.only('should return array of all possibles', async () => {
      const targetDate = moment().subtract(1, 'days');
      const feeGroup = await GfFeeGroup.create({});
      const feeGroupLabel = await GfFeegroupsGroupLabel.create({
        feeGroupId: feeGroup.id,
      });

      const contract = await GfContract.create({
        state: 'active',
        dateActivation: targetDate.format('YYYY-MM-DD'),
        clientId: 1,
        feeGroupId: feeGroup.id,
      });

      const label = await GfFeegroupsLabel.create({ contractId: contract.id });

      await Promise.all([
        GfFeegroupsGroupLabelsXref.create({
          labelId: label.id,
          feeGroupId: feeGroup.id,
        }),
        GfFeegroupsLabelsXref.create({
          feeGroupId: feeGroup.id,
          labelId: label.id,
        }),
      ]);

      const [matrix1, matrix2] = await Promise.all([
        GfDiscountsMatrix.create({
          active: 1,
          alias: 'test by client id',
          type: 'discount',
          feeGroupId: feeGroup.id,
          feeGroupLabelId: feeGroupLabel.id,
        }),
        GfDiscountsMatrix.create({
          active: 1,
          alias: 'test by client id 2',
          type: 'discount',
          numberOfMonths: 3,
          feeGroupId: feeGroup.id,
          feeGroupLabelId: feeGroupLabel.id,
        }),
      ]);

      const [rule1, rule2] = await Promise.all([
        GfDiscountsMatrixRule.create({
          type: 'labeled_contract_present',
          presentLabelId: label.id,
          matrixId: matrix1.id,
        }),
        GfDiscountsMatrixRule.create({
          type: 'labeled_contract_present',
          presentLabelId: label.id,
          matrixId: matrix2.id,
        }),
      ]);

      await GfDiscountsPendingService.updateAllFromClient(contract.clientId);

      const executed = await GfDiscountsExecuted.findAll({
        where: { targetContractId: contract.id },
      });

      console.log(executed);
      const pendings = await GfDiscountsPending.findAll({
        where: { status: 0 },
      });

      expect(executed.length).toBe(2);
      expect(
        executed.map((e) => ({
          targetContractId: e.targetContractId,
          matrixId: e.matrixId,
        })),
      ).toEqual(
        expect.arrayContaining([
          { targetContractId: contract.id, matrixId: matrix1.id },
          { targetContractId: contract.id, matrixId: matrix2.id },
        ]),
      );

      expect(pendings.length).toBe(2);
      expect(
        pendings.map((p) => ({
          clientId: p.clientId,
          contractId: p.contractId,
          matrixId: p.matrixId,
          ambiguos: p.ambiguos,
          key: p.key,
          used: p.used,
        })),
      ).toEqual(
        expect.arrayContaining([
          {
            clientId: contract.clientId,
            contractId: contract.id,
            matrixId: matrix1.id,
            ambiguos: 1,
            key: `1:${matrix1.id}:true:contract${contract.id}`,
            used: JSON.stringify([
              {
                type: 'contract',
                typeId: contract.id,
                matrixId: matrix1.id,
                ruleId: rule1.id,
              },
            ]),
          },
          {
            clientId: contract.clientId,
            contractId: contract.id,
            matrixId: matrix2.id,
            ambiguos: 1,
            key: `1:${matrix2.id}:true:contract${contract.id}`,
            used: JSON.stringify([
              {
                type: 'contract',
                typeId: contract.id,
                matrixId: matrix2.id,
                ruleId: rule2.id,
              },
            ]),
          },
        ]),
      );
    });
  });
});

describe('Negetive Tests', () => {
  describe('Negetive test on `getExclusionRows`', () => {
    it('have to return empty object for not exists `gf-discount-matrix-exclusion`', async () => {
      const exclusions = await GfDiscountsPendingService.getExclusionRows();
      expect(exclusions).toMatchObject({});
    });
  });
  describe('Positive test on `hasIncompatibility`', () => {
    it('have to return `false` if executed `gf-discount-matrix-exclusion` not exists', async () => {
      const targetContractId = Math.random();
      await Promise.all([
        GfDiscountsMatrixExclusion.create({
          id: 1,
          matrixId: 1,
        }),
      ]);

      expect(
        await GfDiscountsPendingService.hasIncompatibility(targetContractId, 1),
      ).toBeFalsy();
    });
  });

  describe('Negetive test on `checkRule`', () => {
    it('prevent return inactive executed for Rule of type `discount_present`', async () => {
      const targetContractId = 100;

      await Promise.all([
        GfContract.create({
          id: targetContractId,
        }),
        GfDiscountsMatrixRule.create({
          id: 1,
          type: 'discount_present',
          presentMatrixId: 1,
        }),
        GfDiscountsExecuted.create({
          id: 1,
          active: 0,
          targetContractId,
          matrixId: 1,
        }),
      ]);

      const executed = await GfDiscountsPendingService.checkRule(
        await GfDiscountsMatrixRule.findByPk(1),
        [],
        await GfContract.findByPk(targetContractId),
      );
      expect(executed).toMatchObject([]);
    });
  });

  describe('Negetive test on `hasDiscountsPending`', () => {
    it('have to return array of exclusion reasons', async () => {
      const feeGroupId = 1;
      const feeGroupLabelId = 1;
      await Promise.allSettled([
        GfFeeGroup.create({ id: feeGroupId }),
        GfContract.create({ id: 1, clientId: 1, feeGroupId }),
        GfFeegroupsGroupLabel.create({ id: feeGroupLabelId, feeGroupId }),
        GfFeegroupsLabel.create({ id: 1, contractId: 1 }),
        GfFeegroupsGroupLabelsXref.create({ labelId: 1, feeGroupId }),
        GfDiscountsMatrix.create({
          id: 1,
          active: 1,
          alias: 'test error',
          feeGroupLabelId,
          feeGroupId,
        }),
        GfDiscountsMatrixRule.create({
          id: 1,
          type: 'labeled_contract_present',
          presentLabelId: 1,
          matrixId: 1,
        }),
      ]);
      const contract = await GfContractService.hydrateContract(
        await GfContract.findByPk(1),
      );
      const possibles = await GfDiscountsPendingService.hasDiscountsPending(
        contract,
        [contract],
      );

      expect(possibles).toMatchObject({
        exclusionReasons: [
          {
            name: 'test error',
            reason: `ruleId:1 contractId:1 matrixId:1 Rule fail, 'labeled_contract_present'`,
          },
        ],
        pending: [],
      });
    });
  });
});
