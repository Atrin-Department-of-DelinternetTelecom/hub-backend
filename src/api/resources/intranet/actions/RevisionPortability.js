//@ts-check
'use strict';

const Action = require('@lib/crud/Action');
const {
  handle: RevisionLandlines,
} = require('@api/service/intranet/Actions/RevisionLandlines');

module.exports = class RevisionPortability extends Action {
  /**
   * Preapre field for json.
   *
   * @param {any} request
   * @param {OperadorLandline[]} models
   * @param {{}} fields
   */
  async handle(request, models, fields) {
    RevisionLandlines(models);
  }
};
