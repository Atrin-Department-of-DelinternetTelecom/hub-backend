import * as GfDiscountsScheduled from '@service/intranet/GfDiscountsScheduledService';
import * as GfDiscountExecutedService from '@service/intranet/GfDiscountsExecuteService';
import * as GfDiscountsService from '@service/intranet/GfDiscountsService';
import moment from 'moment';
import { createRoute } from '@utils/controller-factory';
import { intranet } from '@models';
import { errors } from '@api/http/http_errors';

const {
  GfDiscountsExecuted,
  GfContract,
  GfDiscountsScheduled: scheduledModel,
  MatrixReplacementCombinationRule,
  MatrixReplacementCombinationSet,
  GfDiscountsMatrix,
} = intranet;

export const postGfDiscountsMassive = createRoute({
  handler({ body, user }) {
    return GfDiscountsScheduled.postGfDiscountsMassive(body, user.userId);
  },
});

export const getShortcutMassiveDiscount = createRoute({
  handler(req, res) {
    return GfDiscountsScheduled.getShortcutMassiveDiscount();
  },
});

export const postCreateDiscountByShortcutMassive = createRoute({
  async handler(req, res) {
    const { shortcutId, contractId } = req.swagger.params.body.value;

    const selectedShortcut = GfDiscountsScheduled.ShortcutMassiveDiscount.find(
      (shortcut) => shortcut.id === shortcutId,
    );

    if (!selectedShortcut)
      throw new errors.NotFound(`shortcut with id ${shortcutId} not found.`);

    const contract = await GfContract.findByPk(contractId);
    if (!contract)
      throw new errors.NotFound(`contract with id ${contractId} not found.`);

    return GfDiscountsScheduled.postGfDiscountsMassive(
      {
        ...selectedShortcut.massiveParam,
        contractId,
        dateInit: moment().startOf('month').format('YYYY-MM-DD'),
        dateEnd: moment()
          .startOf('month')
          .add(selectedShortcut.month, 'months')
          .format('YYYY-MM-DD'),
      },
      req.user.userId,
    );
  },
});

export const getDiscountInfo = createRoute({
  handler(req, res) {
    const executedId = req.swagger.params.executedId.value;
    return GfDiscountExecutedService.getDiscountInfo(executedId);
  },
});

export const createDiscountForBreakedPermanent = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;
    const discount = await scheduledModel.findByPk(id);
    if (!discount)
      throw new errors.NotFound(`discount with id ${id} not found`);

    return GfDiscountsScheduled.createDiscountForBreakedPermanent(
      discount.get({ plain: true }),
      req.user.userId,
    );
  },
});

export const removeDiscount = createRoute({
  async handler(req, res) {
    const executedId = req.swagger.params.executedId.value;
    const release = req.swagger.params.release.value;
    const executedDiscount = await GfDiscountsExecuted.findByPk(executedId, {
      include: [
        {
          model: GfDiscountsMatrix,
          as: 'matrix',
          include: [
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
      ],
    });
    if (!executedDiscount || !executedDiscount.active)
      throw new errors.BadRequest(`could not cancel discount`);
    const result = await GfDiscountExecutedService.cancelDiscount(
      executedDiscount,
      release === 'true' ? true : false,
      moment().format('YYYY-MM-DD HH:mm:ss'),
      req.user.id,
    );
    await GfDiscountExecutedService.releaseUsageCombinations(executedDiscount);
    if (!result.success)
      throw new errors.InternalServerError('could not cancel error');

    return 'discount canceled';
  },
});

export const fixInvalidPermanenceDiscount = createRoute({
  async handler(req, res) {
    return GfDiscountsService.fixInvalidPermanenceDiscount();
  },
});
