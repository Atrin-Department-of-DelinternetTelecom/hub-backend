//@ts-check
'use strict';

const helpers = require('@utils/helpers');
const { respondSuccessWithPagination } = require('@utils/response');
const { writeJson } = require('@utils/writer');

module.exports.handle = function (request, res, next) {
  const resource = request.resource();
  const scope = request.scope();

  const { offset, limit, page, size, include } = request.query;

  helpers.with({ offset, limit, where: {}, order: [] }, async (query) => {
    await scope.query(request, query);

    const filters = scope
      .fieldCollection(request)
      .filterable(request)
      .all()
      .map((field) => field.filter(request, query))
      .filter((callback) => callback);

    await Promise.allSettled(filters);

    const sorts = scope
      .fieldCollection(request)
      .sortable(request)
      .all()
      .map((field) => field.sort(request, query))
      .filter((callback) => callback);

    await Promise.allSettled(sorts);

    resource
      .newModel()
      .constructor.findAndCountAll({ ...query, distinct: true })
      .then(async (models) => {
        const rows = await Promise.all(
          models.rows.map((model) => {
            return new scope.constructor(model).serializeForIndex(request);
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
  });
};
