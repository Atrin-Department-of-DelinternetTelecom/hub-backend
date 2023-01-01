//@ts-check
'use strict';

const { errors } = require('@api/http/http_errors');
const {
  SatisfactionForm,
} = require('@api/models/global/global_satisfaction_form');
const Action = require('@lib/crud/Action');
const Json = require('@lib/crud/Fields/Json');
const Text = require('@lib/crud/Fields/Text');
const moment = require('moment');

module.exports = class SubmitSatisfaction extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param fields {{answers: Record<string,unknown>, form: string}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const form = await SatisfactionForm.findUnfilledByFormId(fields.form);

    if (!form) {
      throw new errors.NotFound();
    }

    await form.update({
      answers: fields.answers,
      filled: true,
      filledAt: moment().toISOString(),
    });
  }

  fields() {
    return [
      new Json('answers').rules('required'),
      new Text('form').rules('required'),
    ];
  }
};
