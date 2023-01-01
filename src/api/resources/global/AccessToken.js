//@ts-check
'use strict';
const { AccessToken: Model, User } = require('@models').system;
const { GfCollaborator } = require('@models').intranet;
const ID = require('@lib/crud/Fields/ID');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');
const Authorize = require('./actions/Authorize');
const NumberField = require('@lib/crud/Fields/Number');
const { generatePassword } = require('@api/utils/tools');
const ArrayField = require('@lib/crud/Fields/Array');
const { GfFeeGroup } = require('@api/models/intranet/intranet_gf_fee_groups');
const {
  AccessTokenTag,
} = require('@api/models/global/global_access_token_tag');
const { ContractTag } = require('@api/models/intranet/intranet_contract_tag');

module.exports = class AccessToken extends Resource {
  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: User,
      required: false,
    },
    {
      model: GfCollaborator,
      required: false,
    },
    {
      model: AccessTokenTag,
      include: { model: ContractTag, required: true },
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {typeof import("@crud/Request")} request
   * @return {Array<Field>}
   */
  fields(request) {
    return [
      new ID(),
      new Text('username')
        .sortable()
        .filterable()
        .required()
        .hideWhenUpdating()
        .rules(async (username, attribute, fail) => {
          const model = await Model.findOne({ where: { username } });

          if (model) {
            fail('The username already taken');
          }
        }),
      new Text('password')
        .sortable()
        .filterable()
        .required(request?.isResourceCreateRequest())
        .nullable(!request?.isResourceCreateRequest())
        .onlyOnForms()
        .fillUsing((request, model, attribute) => {
          if (request.filled(attribute)) {
            model.setDataValue(
              'password',
              generatePassword(request.input(attribute)),
            );
          }
        }),
      new NumberField('gf_collaborator_id')
        .sortable()
        .filterable()
        .nullable()
        .rules('existsOnIntranet:GfCollaborator'),
      new NumberField('user_id').sortable().filterable().nullable(),
      new ArrayField('feeGroups', 'feeGroups')
        .default([])
        .fillUsing((request, model, attribute) => {
          if (request.filled(attribute)) {
            model.mergeConfig(attribute, request.input(attribute));
          }
        })
        .resolveUsing(async (_, resource) => {
          return GfFeeGroup.findAll({
            where: { id: resource.config?.feeGroups ?? [] },
          });
        }),
      new ArrayField('tags')
        .default([])
        .fillUsing((request, model, attribute) => {
          if (request.filled(attribute)) {
            return async () => {
              await AccessTokenTag.destroy({
                where: { access_token_id: model.id },
              });
              await AccessTokenTag.bulkCreate(
                request.input(attribute).map((id) => {
                  return {
                    access_token_id: model.id,
                    contract_tag_id: id,
                  };
                }),
              );
            };
          }
        })
        .resolveUsing((_, resource) => {
          return (resource.AccessTokenTags ?? []).map(
            ({ ContractTag }) => ContractTag,
          );
        }),
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return Model;
  }

  actions() {
    return [new Authorize().standalone()];
  }

  /**
   * Serilize resource for index request.
   *
   * @param {Object} request
   * @return {Object}
   */
  async serializeForIndex(request) {
    const { attributes, ...data } = await super.serializeForIndex(request);
    const { password, token, ...safe } = attributes;

    return { ...data, attributes: safe };
  }

  /**
   * Serilize resource for detail request.
   *
   * @param {Object} request
   * @return {{attributes: Record<string, unknown>, fields: Field[], model: AnyModel}}
   */
  async serializeForDetail(request) {
    const { attributes, ...data } = await super.serializeForIndex(request);
    const { password, token, ...safe } = attributes;

    return { ...data, attributes: safe };
  }
};
