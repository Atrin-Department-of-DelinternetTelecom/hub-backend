//@ts-check
'use strict';

const { Document } = require('@api/models/global/global_document');
const Action = require('@lib/crud/Action');

module.exports = class Revoke extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param fields {{iban: string, bic: string, bank: string}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    await Promise.all(models.map((model) => model.update({ isRevoked: true })));
    await Document.update(
      { signed: false },
      { where: { id: models.map(({ docId }) => docId) } },
    );
  }
};
