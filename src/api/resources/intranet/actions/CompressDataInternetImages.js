'use strict';

const {
  GfContractDataInternet,
} = require('@api/models/intranet/intranet_gf_contract_data_internet');
const Action = require('@lib/crud/Action');
const { schedule } = require('@api/service/intranet/ScheduleService');
const NumberField = require('@lib/crud/Fields/Number');
const COMPRESS_IMAGE_PER_PAGE = 5;

module.exports = class CompressDataInternetImages extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {Object} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const resources = request.input('resources', []);
    const count =
      resources.length > 0 ? 1 : await GfContractDataInternet.count();
    const pageSize = fields.per_page ?? COMPRESS_IMAGE_PER_PAGE;

    await schedule(
      'compress-data-internet-images',
      Array.from(
        { length: Math.ceil(count / COMPRESS_IMAGE_PER_PAGE) },
        (_, index) => {
          return {
            userId: request.user.userId,
            page: index + 1,
            pageSize,
            resources,
          };
        },
      ),
    );
  }

  fields() {
    return [new NumberField('per_page').default(5)];
  }
};
