import { addresses, cities, roads } from '@api/service/3th-party/Coverage';

import { createRoute } from '@api/utils/controller-factory';

export const searchAddresses = createRoute({
  async handler(req, res) {
    return addresses({
      address_query: req.swagger.params.address_query.value,
      road_id: req.swagger.params.road_id.value,
      municipality_id: req.swagger.params.municipality_id.value,
      lat: req.swagger.params.lat.value,
      long: req.swagger.params.long.value,
      distance: req.swagger.params.distance.value,
    });
  },
});

export const searchCities = createRoute({
  async handler(req, res) {
    return cities(req.swagger.params.municipality_query.value);
  },
});

export const searchRoads = createRoute({
  async handler(req, res) {
    return roads(
      req.swagger.params.road_query.value,
      req.swagger.params.municipality_id.value,
    );
  },
});
