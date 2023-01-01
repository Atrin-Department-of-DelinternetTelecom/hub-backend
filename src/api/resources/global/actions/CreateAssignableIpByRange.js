//@ts-check
'use strict';
const { ASSIGNABLE } = require('@api/constants/statuses');
const Action = require('@lib/crud/Action');
const Text = require('@lib/crud/Fields/Text');
const { getIPRange } = require('get-ip-range');

module.exports = class CreateAssignableIpByRange extends Action {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {Object} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const assignableModel = request.resource().model();
    const ips = getIPRange(fields.range);
    console.log(assignableModel);

    const exists = await assignableModel.findAll({
      where: { value: ips, type: 'ip' },
    });
    const newIps = ips.filter((ip) => {
      return !exists.find((item) => item.value === ip);
    });

    const created = await assignableModel.bulkCreate(
      newIps.map((value) =>
        Object({
          value,
          type: 'ip',
          state: ASSIGNABLE.ASSIGNABLE,
          creator_id: request.user.id,
        }),
      ),
    );

    return { exists, created };
  }

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new Text('Range')
        .required()
        .default('192.168.1.128-192.168.1.135')
        .rules('required', (value, attribute, fail) => {
          try {
            getIPRange(value);
          } catch (error) {
            fail(error.message);
          }
        }),
    ];
  }
};
