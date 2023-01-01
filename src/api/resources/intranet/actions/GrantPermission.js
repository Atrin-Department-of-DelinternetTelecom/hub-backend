//@ts-check
'use strict';

const {
  GrantPermission: GrantPermissionModel,
} = require('@api/models/hrms/hrms_grant_permission');
const {
  GrantablePermission,
} = require('@api/models/hrms/hrms_grantable_permission');
const {
  handle: GrantPermissionRequest,
} = require('@api/service/intranet/Actions/GrantPermission');
const Action = require('@lib/crud/Action');
const ArrayField = require('@lib/crud/Fields/Array');
const Text = require('@lib/crud/Fields/Text');

module.exports = class GrantPermission extends Action {
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
   * @param {import('@models').AnyModel[]} models
   * @param fields {{name: string, fiscalId: string, description: string, permissions:number[]}} fields
   */
  async handle(request, models, fields) {
    await GrantPermissionRequest(models, {
      ...fields,
      userId: request.user.userId,
    });

    const grantPermission = await GrantPermissionModel.findOne({
      where: {
        clientId: models.map(({ id }) => id),
        authorizedFiscalId: fields.fiscalId,
        authorizedName: fields.name,
        userId: request.user.userId,
        isRevoked: true,
      },
      attributes: ['id', 'docId'],
    });

    return {
      id: grantPermission.id,
      doc_id: `del:${grantPermission.docId}`,
      docId: `del:${grantPermission.docId}`,
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
      new Text('name').rules('required'),
      new Text('fiscalId', 'fiscalId').rules('required'),
      new Text('description').nullable().default(''),
      new ArrayField('permissions').typeOf('number').nullable().default([]),
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
