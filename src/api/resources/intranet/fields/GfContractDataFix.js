//@ts-check
'use strict';
const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const UID = require('@lib/crud/Fields/UID');
const Text = require('@lib/crud/Fields/Text');
const Enum = require('@lib/crud/Fields/Enum');
const { DATA_FIX_TYPE, IVOZ_STATE } = require('@api/constants/contracts');
const { intranet } = require('@models');
const { Op } = require('sequelize');
const { CONTRACT } = require('@api/constants/statuses');
const {
  getActualConditions,
} = require('@api/service/intranet/Fee/GfFeeService');

module.exports = class GfContractDataFix extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {import('@lib/crud/Request')}
   */
  fields(request) {
    return [
      new ID(),

      new UID('UID', 'uid'),

      new NumberField('Contract', 'contractId')
        .sortable()
        .filterable()
        .rules('existsOnIntranet:GfContract'),

      new NumberField('Internet Section', 'internetSectionId')
        .sortable()
        .filterable()
        .rules(async (value, attribute, fail) => {
          const contract = await intranet.GfContract.findOne({
            raw: true,
            nest: true,
            attributes: ['feeGroupId'],
            include: {
              model: intranet.GfContractDataFix,
              as: 'dataFix',
              id: request.resourceId(),
              attributes: ['id', 'contractId'],
            },
          });
          const condition = await getActualConditions(contract.feeGroupId);
          // check call forwarding
          if (condition && condition.isCallForwarded()) {
            return true;
          }
          // check internet connection
          if (!value) {
            fail(`internet section is mandatory.`);
          }
          const internet = await intranet.GfContract.findByPk(value);

          if (!internet?.isActive()) {
            fail(`internet section with id:${value} is not active.`);
          }
        }),

      new Text('directIp', 'directIp').nullable(),

      new Enum('type')
        .default(DATA_FIX_TYPE.PARTICULAR)
        .sortable()
        .filterable()
        .rules('required', 'in:' + Object.values(DATA_FIX_TYPE).join(','))
        .options({
          [DATA_FIX_TYPE.PARTICULAR]: DATA_FIX_TYPE.PARTICULAR,
          [DATA_FIX_TYPE.COMPANY]: DATA_FIX_TYPE.COMPANY,
        }),

      new Text('ID Tpv', 'idTpv').nullable().sortable().filterable(),
      new NumberField('Trusted Id', 'trustedId').nullable(),
      new Text('Trusted Description', 'trustedDescription').nullable(),
      new NumberField('portability').default(0).sortable().filterable(),
      new NumberField('Pot Id', 'potId').nullable(),
      new Text('number')
        .nullable()
        .filterable()
        .sortable()
        .rules('required', 'numeric', async (value, attribute, fail) => {
          const { GfContractDataFix, GfContract } = intranet;
          const found = await GfContractDataFix.findOne({
            where: { number: value, id: { [Op.not]: request.resourceId() } },
            include: [
              {
                model: GfContract,
                as: 'contract',
                required: true,
                where: {
                  state: {
                    [Op.not]: CONTRACT.SUSPENDED,
                  },
                },
              },
            ],
          });

          if (found !== null) {
            fail(`The number:${value} alredy taken.`);
          }
        })
        .required(),

      new NumberField('nat').nullable(),
      new NumberField('kamailioDone', 'kamailioDone')
        .default(0)
        .sortable()
        .filterable(),

      new DateTime('aireExecuteDate', 'aireExecuteDate').nullable().default(''),
      new Text('airePortaId', 'airePortaId').nullable().default(''),
      new Text('aireStatus', 'aireStatus').nullable().default(''),

      new NumberField('invoiced', 'invoiced')
        .default(0)
        .sortable()
        .filterable(),

      new NumberField('haveTeleassistance', 'haveTeleassistance')
        .default(0)
        .sortable()
        .filterable(),

      new NumberField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms(),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),
      new NumberField('technician_id', 'technician_id')
        .nullable()
        .default(request?.user?.userId),

      ...this.ivozFields(request),
    ];
  }

  ivozFields(request) {
    const resolveCallback = (value, resource, attribute) => {
      return resource.GfIvozFix?.get(attribute);
    };

    return [
      new NumberField('giverOperator', 'giverOperator').nullable(),
      new Text('extension').nullable().default('').filterable().sortable(),
      new Text('password').nullable().default('').filterable().sortable(),
      new Text('description').default('').filterable().sortable(),
      new DateTime('autoExecuteDate', 'autoExecuteDate').nullable().default(''),

      new Text('email')
        .nullable()
        .filterable()
        .resolveUsing(resolveCallback)
        .exceptOnForms(),

      new NumberField('useAta', 'useAta')
        .default(0)
        .nullable()
        .sortable()
        .filterable()
        .resolveUsing(resolveCallback)
        .exceptOnForms(),

      new NumberField('voicemail', 'voicemail')
        .default(0)
        .nullable()
        .sortable()
        .filterable()
        .resolveUsing(resolveCallback)
        .exceptOnForms(),

      new NumberField('sync', 'sync')
        .default(0)
        .nullable()
        .sortable()
        .filterable()
        .resolveUsing(resolveCallback)
        .exceptOnForms(),

      new Text('language')
        .nullable()
        .default('en')
        .resolveUsing(resolveCallback)
        .exceptOnForms(),
      new Text('error')
        .nullable()
        .resolveUsing(resolveCallback)
        .exceptOnForms(),

      new NumberField('ring_time', 'ring_time')
        .nullable()
        .default(60)
        .resolveUsing(resolveCallback)
        .exceptOnForms(),
      new NumberField('maxInboundCalls', 'maxInboundCalls')
        .nullable()
        .default(2)
        .resolveUsing(resolveCallback)
        .exceptOnForms(),
      new NumberField('maxCalls', 'maxCalls')
        .nullable()
        .default(2)
        .resolveUsing(resolveCallback)
        .exceptOnForms(),
      new NumberField('Call Forward', 'cf')
        .nullable()
        .default(0)
        .resolveUsing(resolveCallback)
        .exceptOnForms(),
      new NumberField('Call Forward Busy', 'cfb')
        .nullable()
        .default(0)
        .resolveUsing(resolveCallback)
        .exceptOnForms(),
      new NumberField('Call Forward No Answer', 'cfu')
        .nullable()
        .default(0)
        .resolveUsing(resolveCallback)
        .exceptOnForms(),

      new Enum('state')
        .default(IVOZ_STATE.PENDING)
        .sortable()
        .filterable()
        .resolveUsing(resolveCallback)
        .exceptOnForms()
        .options({
          [IVOZ_STATE.PENDING]: 'pending',
          [IVOZ_STATE.INPROGRESS]: 'in_progress',
          [IVOZ_STATE.DONE]: 'done',
          [IVOZ_STATE.ERROR]: 'error',
          [IVOZ_STATE.PREPARING]: 'preparing',
          [IVOZ_STATE.PREPARED]: 'prepared',
        }),
    ];
  }
};
