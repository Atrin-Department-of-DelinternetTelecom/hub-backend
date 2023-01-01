//@ts-check
'use strict';

const helpers = require('@utils/helpers');
const { respondSuccessWithPagination } = require('@utils/response');
const { writeJson } = require('@utils/writer');

module.exports.index = function (request, res, next) {
  const resource = request.resource();

  const { offset, limit, page, size, include } = request.query;

  helpers.with({ offset, limit, where: {}, order: [] }, async (query) => {
    await resource.buildIndexQuery(request, query);

    const filters = resource
      .fieldCollection(request)
      .filterable(request)
      .all()
      .map((field) => field.filter(request, query))
      .filter((callback) => callback);

    await Promise.allSettled(filters);

    const sorts = resource
      .fieldCollection(request)
      .sortable(request)
      .all()
      .map((field) => field.sort(request, query))
      .filter((callback) => callback);

    await Promise.allSettled(sorts);

    try {
      resource
        .newModel()
        .constructor.findAndCountAll({ ...query, distinct: true })
        .then(async (models) => {
          const rows = await Promise.all(
            models.rows.map((model) => {
              const resource = request.newResource(model);

              return resource.serializeForIndex(request);
            }),
          );

          writeJson(
            res,
            respondSuccessWithPagination(
              rows.map((row) => row.attributes),
              Array.isArray(models.count) ? models.count.length : models.count,
              size,
              page,
              request.fullUrl(),
            ),
          );
        })
        .catch((error) => res.respondError(error));
    } catch (error) {
      console.log(error);
      res.respondError(error);
    }
  });
};
