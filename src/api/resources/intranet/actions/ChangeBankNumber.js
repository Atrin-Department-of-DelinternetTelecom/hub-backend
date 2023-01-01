//@ts-check
'use strict';

const {
  handle: ChangeIban,
} = require('@api/service/intranet/Actions/ChangeIban');
const { firstPopulated } = require('@api/utils/helpers');
const Action = require('@lib/crud/Action');
const Text = require('@lib/crud/Fields/Text');
const iban = require('iban');

module.exports = class ChangeBankNumber extends Action {
  /**
   * Determin if actions is inline.
   *
   * @type {Boolean}
   */
  #inlineAction = true;

  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param fields {{iban: string, bic: string, bank: string}} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const changeIbanRequest = await ChangeIban({
      clientId: models[0].id,
      userId: request.user.userId,
      iban: firstPopulated([fields.iban]),
      bic: firstPopulated([fields.bic]),
      bank: firstPopulated([fields.bank]),
    });

    return {
      id: changeIbanRequest.id,
      doc_id: `del:${changeIbanRequest.doc_id}`,
    };
  }

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields() {
    return [
      new Text('iban').rules('required', (value, attribute, fail) => {
        if (!iban.isValid(value)) {
          fail('Iban has invalid format');
        }
      }),
      new Text('bic'),
      new Text('bank'),
    ];
  }

  /**
   * Prepare resource for swager config.
   *
   * @return {Object}
   */
  swaggerResponse() {
    return {
      description: `Run action for given resources`,
      schema: {
        type: 'object',
        required: ['data', 'meta'],
        properties: {
          data: {
            type: 'object',
            properties: {
              id: {
                type: 'number',
              },
              doc_id: {
                type: 'string',
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              code: {
                type: 'number',
                example: 201,
              },
              status: {
                type: 'string',
                minLength: 1,
                example: 'success',
              },
            },
            required: ['code', 'message', 'status'],
          },
        },
        description: `Resource created`,
      },
    };
  }
};
