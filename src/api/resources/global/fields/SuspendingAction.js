//@ts-check
'use strict';

const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const Text = require('@lib/crud/Fields/Text');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const NumberField = require('@lib/crud/Fields/Number');
const ArrayField = require('@lib/crud/Fields/Array');
const { Op, literal } = require('sequelize');
const { intranet: knex } = require('@lib/knex');
const { SUSPENSION_ACTION_TYPE } = require('@api/constants/contracts');
const Enum = require('@lib/crud/Fields/Enum');
const {
  GfContractDataInternet,
} = require('@api/models/intranet/intranet_gf_contract_data_internet');
const { SUSPENDING_STATE } = require('@api/constants/statuses');

module.exports = class SuspendingAction extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object?} request
   * @return {Array<Field>}
   */
  fields(request) {
    return [
      new ID(),
      new NumberField('Gf Contract Id')
        .filterable()
        .sortable()
        .rules('existsOnIntranet:GfContract'),

      new ArrayField('Reasons')
        .filterable((req, query, value, operator) => {
          query = this.normalizeQuery(query);

          const subQuery = knex('delinternet_hub.suspending_action_reason AS x')
            .select(1)
            .limit(1)
            .where('x.suspending_reason_id', 'in', knex.raw('?', [value]))
            .where(
              'x.suspending_action_id',
              '=',
              knex.raw('SuspendingAction.id'),
            )
            .toQuery();

          query.where[Op.and].push(literal(`EXISTS (${subQuery})`));
        })
        .sortable()
        .onlyOnForms()
        .required()
        .rules([
          (request?.isResourceCreateRequest() ||
            request?.isResourceUpdateRequest()) &&
          (request.filled('comment') ||
            request.input('action_type') === SUSPENSION_ACTION_TYPE.FROZEN)
            ? 'nullable'
            : 'required',
          (value, attribute, fail) => {
            if (
              request.input('comment') ||
              request.input('action_type') === SUSPENSION_ACTION_TYPE.FROZEN
            ) {
              return;
            }
            if (!Array.isArray(value) || value.length <= 0) {
              fail('Reasons is mandatory');
            }
          },
        ])
        .fillUsing((request, model, attribute) => {
          return async () => {
            // sync reasons
            await model.setSuspendingReasons([]);
            await model.sequelize.models.SuspendingActionReason.bulkCreate(
              request.input('reasons', []).map((suspending_reason_id) => ({
                suspending_reason_id,
                suspending_action_id: model.id,
              })),
            );
          };
        }),

      new NumberField('Operator Id')
        .nullable()
        .rules('existsOnSystem:User')
        .fillUsing((request, model, attribute) => {
          model.setDataValue(
            attribute,
            request.input(attribute) || request.user.userId,
          );
        }),

      new Text('comment').filterable().sortable().nullable().default(null),

      new Enum('action_type', 'action_type')
        .options(SUSPENSION_ACTION_TYPE)
        .filterable()
        .sortable()
        .default(SUSPENSION_ACTION_TYPE.DELETE)
        .rules(async (value, attribute, fail) => {
          if (value !== SUSPENSION_ACTION_TYPE.FROZEN) {
            return;
          }

          const dataInternet = await GfContractDataInternet.findOne({
            where: { contractId: request.input('gf_contract_id') },
            include: 'contract',
          });

          if (!dataInternet) {
            fail('Only internet contracts could be frozen');
          }
        }),

      new Enum('state')
        .options(SUSPENDING_STATE)
        .filterable()
        .sortable()
        .default(SUSPENDING_STATE.SCHEDULED),

      new NumberField('doc_id').filterable().default('').nullable(),
      new Text('docId', 'docId')
        .exceptOnForms()
        .nullable()
        .virtual(function () {
          const docId = this.getDataValue('doc_id');
          return docId ? `del:${docId}` : null;
        }),

      new Text('provider_tracking_code').filterable().nullable().default(''),

      new Text('reference')
        .hideOnForms()
        .hideOnSequelize()
        .resolveUsing((value, resource) => resource.GfContract?.reference)
        .filterable((req, query, value, operator) => {
          query = this.normalizeQuery(query);

          const subQuery = knex('intranet.gf_contracts AS x')
            .select(1)
            .limit(1)
            .where(
              'x.reference',
              'like',
              `%${String(value).replace(/%/g, '')}%`,
            )
            .where('x.status', '=', 1)
            .where('x.id', '=', knex.raw('SuspendingAction.gf_contract_id'))
            .toQuery();

          query.where[Op.and].push(literal(`EXISTS (${subQuery})`));
        }),

      new Text('type')
        .hideOnForms()
        .hideOnSequelize()
        .resolveUsing((value, resource) => resource.GfContract?.type)
        .filterable((req, query, value) => {
          query = this.normalizeQuery(query);

          const subQuery = knex('intranet.gf_contracts AS x')
            .select(1)
            .limit(1)
            .join(
              'intranet.gf_feegroups_sections_xref AS gfsx',
              'gfsx.feeGroupId',
              '=',
              'x.feeGroupId',
            )
            .join('intranet.gf_sections AS gs', 'gs.id', '=', 'gfsx.sectionId')
            .where('gs.code', 'in', knex.raw('?', [value]))
            .where('x.status', '=', 1)
            .where('x.id', '=', knex.raw('SuspendingAction.gf_contract_id'))
            .toQuery();

          query.where[Op.and].push(literal(`EXISTS (${subQuery})`));
        }),

      new DateTime('Suspend Date', 'suspend_at')
        .nullable()
        .filterable()
        .sortable(),

      new DateTime('Suspenion Date', 'suspended_at')
        .nullable()
        .filterable()
        .sortable(),

      new DateTime('Creation Date', 'created_at')
        .exceptOnForms()
        .nullable()
        .filterable()
        .sortable(),

      new DateTime('Update Date', 'updated_at').exceptOnForms().nullable(),
    ];
  }

  normalizeQuery(query = {}) {
    if (query.where === undefined) {
      query.where = {};
    }

    if (!Array.isArray(query.where[Op.and])) {
      query.where[Op.and] = [query.where[Op.and]].filter((value) => value);
    }

    return query;
  }
};
