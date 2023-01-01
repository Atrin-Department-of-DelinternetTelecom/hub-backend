import { Request } from 'express';
import { chunk } from 'lodash';
import { createRoute } from '@api/utils/controller-factory';
import { lemon } from '@lib/lemon';
import { respondSuccessWithPagination } from '@api/utils/response';
import { extractCDRs } from '@api/service/intranet/LemonCdrService';

const respond = (
  req: Request,
  items: Array<Record<string, number | string>>,
) => {
  const filteredItems = items.filter(({ name }) => {
    if (req.hasFilter('name')) {
      return (name as string)
        .toLowerCase()
        .includes(req.filter('name').value.toLowerCase());
    }
    return true;
  });
  const size = Number(req.query.size ?? 10);
  const page = Number(req.query.page ?? 1);
  const paginated = chunk(filteredItems, size);

  return respondSuccessWithPagination(
    paginated[page > 0 ? page - 1 : 0] ?? [],
    filteredItems.length,
    size,
    page,
    new URL(
      req.protocol +
        '://' +
        req.get('host') +
        req.url.slice(0, req.url.indexOf('?')),
    ),
  );
};

export const regions = createRoute({
  async handler(req, res) {
    const { data: regions } = await lemon.client.getRegions();

    return respond(
      req,
      regions.map((region) => {
        return {
          id: region.id,
          name: region.Comunidad_Autonoma,
        };
      }),
    );
  },
});

export const provinces = createRoute({
  async handler(req, res) {
    const { data: provinces } = await lemon.client.getProvince(
      req.swagger.params.id.value,
    );

    return respond(
      req,
      provinces.map((province) => {
        return {
          id: province.id,
          name: province.Provincia,
          locationId: province.idComunidad_Autonoma,
        };
      }),
    );
  },
});

export const cities = createRoute({
  async handler(req, res) {
    const { data: cities } = await lemon.client.getCitiesOfProvince(
      req.swagger.params.id.value,
    );

    return respond(
      req,
      cities.map((city) => {
        return {
          id: city.id,
          name: city.Poblacion,
          locationId: city.idProvincia,
        };
      }),
    );
  },
});

export const importLemonData = createRoute({
  async handler(req) {
    const date = req.swagger.params.date.value;
    return extractCDRs(date);
  },
});
