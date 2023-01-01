//@ts-check
'use strict';

const {
  revisionNumber,
  revisionClient,
} = require('@api/service/intranet/LemonRevisionService');
const { revisionLemonLines } = require('@api/service/intranet/ScheduleService');
const Action = require('@lib/crud/Action');
const Text = require('@lib/crud/Fields/Text');

module.exports = class RevisionLemonLines extends Action {
  async handle(request, models, { fiscal_id, number } = {}) {
    if (number) {
      return this.parseResults(
        await revisionNumber(number, request.user.userId),
      );
    }
    if (fiscal_id) {
      return this.parseResults(
        await revisionClient(fiscal_id, request.user.userId),
      );
    }

    return revisionLemonLines(request.user.userId);
  }

  parseResults(results = []) {
    if (results.find((result) => result.status === 'rejected')) {
      console.log(results);
      throw new Error('Some importing failed!');
    }

    return results;
  }

  fields() {
    return [new Text('number').nullable(), new Text('fiscalId').nullable()];
  }
};
