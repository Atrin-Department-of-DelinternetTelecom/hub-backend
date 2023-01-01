//@ts-check
'use strict';

const { ASSIGNABLE } = require('@api/constants/statuses');
const {
  OperadorLandline,
} = require('@api/models/intranet/intranet_operador_landline');
const Action = require('@lib/crud/Action');
const assert = require('assert');
const { literal } = require('sequelize');

module.exports = class RandomNumber extends Action {
  /**
   * Preapre field for json.
   *
   * @param {any} request
   * @param {OperadorLandline[]} models
   * @param {{}} fields
   */
  async handle(request, models, fields) {
    const numbers = await OperadorLandline.findAll({
      order: [[literal('RAND()')]],
      where: { state: ASSIGNABLE.ASSIGNABLE },
      attributes: ['number'],
      limit: 1,
      raw: true,
    });

    assert(numbers.length > 0, 'Not found any number');

    return numbers[0];
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
              number: {
                type: 'string',
                example: '123456879',
              },
            },
          },
          meta: {
            type: 'object',
            properties: {
              code: {
                type: 'number',
                example: 200,
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
      },
    };
  }
};
