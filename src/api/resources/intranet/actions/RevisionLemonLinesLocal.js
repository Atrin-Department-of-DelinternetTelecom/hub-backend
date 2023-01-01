//@ts-check
'use strict';

const {
  revisionClientLocal,
  revisionNumberLocal,
} = require('@api/service/intranet/LemonRevisionService');

const Action = require('@lib/crud/Action');
const Text = require('@lib/crud/Fields/Text');

module.exports = class RevisionLemonLinesLocal extends Action {
  async handle(request, models, { fiscal_id, number } = {}) {
    if (number) {
      return this.parseResults(
        await revisionNumberLocal(number, request.user.userId),
      );
    }

    if (fiscal_id) {
      return this.parseResults(
        await revisionClientLocal(fiscal_id, request.user.userId),
      );
    }

    throw new Error('number or fiscal_id is required for local revision');
  }

  parseResults(results = []) {
    if (Array.isArray(results)) {
      const failed = results.find((result) => result?.status === 'rejected');

      if (failed) {
        console.log(results);
        throw new Error('Some local contract revisions failed!');
      }
    }

    return results;
  }

  fields() {
    return [new Text('number').nullable(), new Text('fiscal_id').nullable()];
  }
};
