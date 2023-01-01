import { respondSuccess, respondSuccessWithPagination } from '@utils/response';

import { Aire } from '@lib/sdk';
import { AireAdditionalBono } from '@api/service/intranet/AireService';
import { Static } from '@lib/cache';
import { chain } from 'lodash';
import { createRoute } from '@api/utils/controller-factory';
import { paginate } from '@api/utils/collections';

export const getPossibleNumber = createRoute({
  async handler(req, res) {
    const { code, numbers } = await Aire.getPossibleNumbers();
    return respondSuccess({
      number: numbers[0],
      code,
    });
  },
});

export const getPoolEsim = createRoute({
  async handler(req, res) {
    return { numbers: await Aire.getPoolESIM() };
  },
});

export const getBonos = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const bonos = await AireAdditionalBono.findAll({
      tarifa: id,
      tarifa_basica: 'N',
    });

    return respondSuccess(bonos);
  },
});

export const roamingBonuses = createRoute({
  async handler(req) {
    const perPage = Number(req.query.size ?? 25);
    const page = Number(req.query.page ?? 1);

    const bonuses = await Static.sear(
      'aire-roaming-bonuses',
      async () => Aire.RoamingBonus.findAll(),
      60,
    );

    const filters = Object.keys(req.filters());

    const filteredBonuses = bonuses.filter((bonuse) => {
      if (filters.length === 0) {
        return true;
      }

      return filters.every((filter) => {
        return (bonuse[filter] ?? '')
          .toLowerCase()
          .includes(req.filter(filter).value.toLowerCase().replace('%', ''));
      });
    });

    const paginated =
      chain(filteredBonuses)
        .chunk(perPage)
        .nth(page - 1)
        .value() || [];

    return respondSuccessWithPagination(
      paginated,
      filteredBonuses.length,
      perPage,
      page,
    );
  },
});
