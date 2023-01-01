import * as SuggestDiscount from '@api/service/intranet/SuggestDiscountService';

import { createRoute } from '@api/utils/controller-factory';
import { errors } from '@api/http/http_errors';

export const suggestDiscount = createRoute({
  async handler(req) {
    const clientId = req.swagger.params.clientId.value;
    return SuggestDiscount.suggestDiscount(clientId);
  },
});

export const suggestDiscounts = createRoute({
  async handler(req) {
    req.query.url =
      req.protocol +
      '://' +
      req.get('host') +
      req.url.slice(0, req.url.indexOf('?'));

    return SuggestDiscount.suggestDiscounts(req.query);
  },
});

export const postPackageStatus = createRoute({
  async handler(req) {
    const clientId = req.swagger.params.clientId.value;
    const matrixId = req.swagger.params.matrixId.value;
    return SuggestDiscount.postPackageStatus(
      { clientId, matrixId, contracts: req.body },
      req.user.userId,
    );
  },
});

export const getPackageDiscountInfoById = createRoute({
  async handler(req) {
    const packageId = req.swagger.params.packageId.value as string;
    const clientId = req.swagger.params.clientId.value;
    const splitedIds = packageId.split(':');
    const length = splitedIds.length;
    if (length < 1 || length > 2)
      throw new errors.NotFound(`invalid id structure`);

    const matrixId = Number(splitedIds[0]);
    const packageStatusId = Number(splitedIds[1] ?? 0);

    if (isNaN(matrixId) || isNaN(packageStatusId))
      throw new errors.BadRequest(`invalid id structure`);

    return SuggestDiscount.getPackageDiscountInfoById(
      clientId,
      matrixId,
      packageStatusId,
    );
  },
});
