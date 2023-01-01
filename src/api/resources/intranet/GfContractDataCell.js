//@ts-check
'use strict';
const AddAireBonus = require('./actions/AddAireBonus');
const { GfCellProviderFeeBonus } = require('@models').intranet;
const { GfCellProviderFeeBonusXref } = require('@models').intranet;
const { GfContract } = require('@models').intranet;
const { GfContractDataCellInitialBonusXref } = require('@models').intranet;
const { GfContractSectionStatus } = require('@models').intranet;
const GfContractSectionStatusService = require('@service/intranet/GfContractSectionStatusService');
const Resource = require('@lib/crud/Resource');
const SyncState = require('./actions/SyncState');
const { GfSection } = require('@api/models/intranet/intranet_gf_sections');
const { GfFee } = require('@api/models/intranet/intranet_gf_fees');
const {
  SERVICE,
  CELL_ACTUAL_MODALITY,
  CELL_PAYMENT_METHOD,
  CELL_PROVIDER_CODE,
  CELL_SIM_TYPE,
  BLOCK_STATE,
} = require('@api/constants/contracts');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const Text = require('@lib/crud/Fields/Text');
const Enum = require('@lib/crud/Fields/Enum');
const DateTime = require('@lib/crud/Fields/DateTime');
const ArrayField = require('@lib/crud/Fields/Array');
const { GfClient } = require('@api/models/intranet/intranet_gf_clients');
const { AireLine } = require('@api/service/intranet/AireService');
const UID = require('@lib/crud/Fields/UID');
const { associateBy } = require('@api/utils/collections');
const {
  SECTION_STATUS,
  LEMON_PORTABILITY_STATUS,
} = require('@api/constants/statuses');
const { lemon } = require('@lib/lemon');
const { default: to } = require('await-to-js');
const {
  transformLemonHistory,
  getAireRoamingBonuses,
} = require('@api/service/intranet/GfContractDataCellService');
const { provider } = require('@api/service/intranet/Contract/helpers');
const Json = require('@lib/crud/Fields/Json');
const { AireRequest } = require('@api/models/global/global_aire_requests');
const SetMaximumConsumption = require('./actions/SetMaximumConsumption');
const {
  GfContractDataCell: Model,
} = require('@api/models/intranet/intranet_gf_contract_data_cell');
const {
  GfAireContract,
} = require('@api/models/intranet/intranet_gf_aire_contracts');
const { LemonLine } = require('@api/models/intranet/intranet_lemon_line');
const AssignSecondarySim = require('./actions/AssignSecondarySim');
const RevokeSecondarySim = require('./actions/RevokeSecondarySim');
const ExchangeSimCard = require('./actions/ExchangeSimCard');
const RevokeEsimRequest = require('./actions/RevokeEsimRequest');
const ResendValidationCode = require('./actions/ResendValidationCode');
const ToggleSimState = require('./actions/ToggleSimState');
const ConfigureSecondarySim = require('./actions/ConfigureSecondarySim');
const AddAireRoamingBonus = require('./actions/AddAireRoamingBonus');
const { Aire } = require('@lib/sdk');
const CancelAireRoamingBonus = require('./actions/CancelAireRoamingBonus');

module.exports = class GfContractDataCell extends Resource {
  /**
   * Determine that need to "index" API.
   *
   * @type {Boolean}
   */
  configureIndexSwagger = false;

  /**
   * Determine that need to "create" API.
   *
   * @type {Boolean}
   */
  configureCreateSwagger = false;

  /**
   * Determine that need to "delete" API.
   *
   * @type {Boolean}
   */
  configureDeleteSwagger = false;

  /**
   * Eager loaded relation ships.
   *
   * @type {Array}
   */
  include = [
    {
      model: GfContract,
      as: 'contract',
      required: false,
      include: [
        {
          model: GfFee,
          as: 'fees',
        },
        {
          model: GfContractSectionStatus,
          as: 'statuses',
        },
      ],
    },
    {
      model: GfCellProviderFeeBonus,
      as: 'bonuses',
      required: false,
      include: [
        {
          model: GfCellProviderFeeBonusXref,
          as: 'providerXrefs',
          required: false,
        },
      ],
    },
    {
      model: AireRequest,
      required: false,
    },
    {
      model: AireRequest,
      required: false,
    },
    {
      model: GfAireContract,
      required: false,
    },
    {
      model: LemonLine,
      required: false,
    },
  ];

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Request}
   */
  fields(request) {
    return [
      new ID(),

      new UID(),

      new NumberField('Portability')
        .sortable()
        .filterable()
        .required()
        .default(0),

      new Text('Number')
        .sortable()
        .filterable()
        .required()
        .nullable()
        .rules(async (value, attribute, fail) => {
          const resource = await request.findModelOrFail();
          const cellProvider = await provider(resource.contractId);

          if (cellProvider === CELL_PROVIDER_CODE.AIRE && !value) {
            fail(`The ${attribute} is mandatory for AIRE service`);
          }
        }),

      new Text('Contract', 'contractId').sortable().filterable().readonly(),

      new Text('ICC & DC', 'iccPlusControlDigit')
        .sortable()
        .filterable()
        .required()
        .rules('requiredIf:simType,physical', 'minLength:19', 'maxLength:20'),

      new Enum('Actual Modality', 'actualModality')
        .nullable()
        .default(null)
        .required()
        .rules('requiredIf:portability,1')
        .options(
          associateBy(Object.values(CELL_ACTUAL_MODALITY), (val) => val),
        ),

      new Enum('Sim Payment Method', 'simPaymentMethod')
        .sortable()
        .filterable()
        .nullable()
        .options(associateBy(Object.values(CELL_PAYMENT_METHOD), (val) => val)),

      new Enum('simType', 'simType')
        .sortable()
        .filterable()
        .nullable()
        .default(CELL_SIM_TYPE.PHYSICAL)
        .options(associateBy(Object.values(CELL_SIM_TYPE), (val) => val)),

      new Text('email')
        .sortable()
        .filterable()
        .nullable()
        .rules('requiredIf:simType,esim'),

      new Text('Origen ICC', 'origenIcc').nullable(),

      new Text('Origen Control Digit', 'origenControlDigit').nullable(),

      new Text('Provider Reserve Code', 'providerReserveCode').nullable(),

      new Text('Provider Request Code', 'providerRequestCode')
        .nullable()
        .exceptOnForms(),

      new Text('Last Get State Text', 'lastGetStateText')
        .nullable()
        .exceptOnForms(),

      new Text('Document').nullable().exceptOnForms(),

      new Text('Portability Document', 'portabilityDoc')
        .nullable()
        .exceptOnForms(),

      new Text('Extra Document', 'extraDoc').nullable().exceptOnForms(),

      new Text('Ventana De Cambio', 'ventanaDeCambio')
        .nullable()
        .exceptOnForms(),

      new Text('Linked Aire', 'linkedAireId')
        .nullable()
        .sortable()
        .filterable()
        .exceptOnForms(),

      new Text('provider')
        .hideOnIndex()
        .resolveUsing(async (value, resource) => provider(resource.contractId)),

      new ArrayField('histories')
        .onlyOnDetail()
        .resolveUsing(async (value, resource) => {
          const cellProvider = await provider(resource.contractId);

          if (
            cellProvider !== CELL_PROVIDER_CODE.LEMON ||
            !resource.portability ||
            !resource.number
          ) {
            return [];
          }
          const [error, response] = await to(
            lemon.cell.getPortabilityByNumber(resource.number),
          );

          return error ? [] : response.data.map(transformLemonHistory);
        })
        .swagger('items', {
          type: 'object',
          properties: {
            oldState: { type: 'string' },
            newState: { type: 'string' },
            date: { type: 'string' },
            message: { type: 'string' },
          },
        })
        .help(`Possible states: ${Object.values(LEMON_PORTABILITY_STATUS)}`),

      new DateTime('Last Revision', 'lastRevision').nullable().exceptOnForms(),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),

      new ArrayField('Bonos', 'bonos')
        .nullable()
        .default([])
        .onlyOnForms()
        .fillUsing((req, model, attribute) => {
          if (!req.has(attribute)) return;

          return async (req, model, transaction) => {
            await GfContractDataCellInitialBonusXref.update(
              { status: 0 },
              { where: { dataCellId: model.get('id') }, transaction },
            );

            await GfContractDataCellInitialBonusXref.bulkCreate(
              req.input('bonos', []).map((aireBonoId) => {
                return {
                  dataCellId: model.id,
                  aireBonoId,
                };
              }),
            );
          };
        }),

      new ArrayField('Aire Bonos', 'aireBonos')
        .onlyOnDetail()
        .hideOnSwagger(false)
        .default([])
        .resolveUsing(async (value, model) => {
          if (!model.get('number')) return [];

          // @ts-ignore
          const client = await GfClient.findByContractId(model.contractId);

          const line = await AireLine.findOne({
            activo: 'SI',
            telefono: model.get('number'),
            fiscalId: client.fiscalId,
          });

          if (!line) return [];
          if (!Array.isArray(line.bonos)) return [];

          return line.bonos.map((bono) => ({
            ...bono,
            cod: bono.id,
          }));
        })
        .typeOf({
          type: 'object',
          properties: {
            cod: { type: 'string' },
            descripcion: { type: 'string' },
            fecha_alta: { type: 'string' },
            fecha_baja: { type: 'string' },
            id: { type: 'string' },
            id_bono: { type: 'string' },
            pvp: { type: 'string' },
            tipo: { type: 'string' },
          },
        }),

      new ArrayField('Aire Roaming Bonos', 'aireRoamingBonos')
        .onlyOnDetail()
        .hideOnSwagger(false)
        .default([])
        .resolveUsing((value, model) => {
          return getAireRoamingBonuses(model.get('number'));
        })
        .typeOf({
          type: 'object',
          properties: {
            capacidad: { type: 'string' },
            descripcion: { type: 'string' },
            fecha_alta: { type: 'string' },
            fecha_baja: { type: 'string' },
            id: { type: 'string' },
            nombre: { type: 'string' },
            pvp: { type: 'string' },
            iso_pais: { type: 'string' },
            renovaciones: { type: 'string' },
            type: { type: 'string', enum: ['REQUEST', 'CONTRACT'] },
            estado: {
              type: 'string',
              enum: ['PENDIENTE', 'ACTIVO', 'CANCELADO', 'BAJA'],
            },
          },
        }),

      new Json('request').exceptOnForms().swagger('properties', {
        createdAt: {
          type: 'string',
        },
        deferredPortability: {
          type: 'string',
        },
        status: {
          type: 'string',
        },
        windowChange: {
          type: 'string',
        },
        portability: {
          type: 'boolean',
        },
        observations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: {
                type: 'string',
              },
              hour: {
                type: 'string',
              },
              description: {
                type: 'string',
              },
            },
          },
        },
      }),

      new Json('additionalInfo', 'additionalInfo')
        .exceptOnForms()
        .nullable()
        .default({})
        .swagger('properties', {
          isBlocked: {
            type: 'boolean',
            description: 'Indicates whether the service is blocked or not.',
          },
          blockState: {
            type: 'string',
            enum: Object.values(BLOCK_STATE),
            description: 'Indicates the service block state.',
          },
          blockDate: {
            type: 'string',
            description: 'Indicates the service block date.',
          },

          active: {
            type: 'boolean',
            description: 'Indicates whether the service is active.',
          },
          maximumConsumption: {
            type: 'number',
            description:
              'The maximum consumption limit for the service. Null if not applicable.',
          },
          simCards: {
            type: 'array',
            description: 'List of associated SIM cards.',
            items: {
              type: 'object',
              properties: {
                icc: {
                  type: 'string',
                  description:
                    'Integrated Circuit Card (ICC) number of the SIM.',
                },
                pin1: {
                  type: 'string',
                  description: 'First PIN code for the SIM card.',
                },
                pin2: {
                  type: 'string',
                  description: 'Second PIN code for the SIM card.',
                },
                puk: {
                  type: 'string',
                  description: 'PUK code for the SIM card.',
                },
                puk2: {
                  type: 'string',
                  description: 'Second PUK code for the SIM card.',
                },
                role: {
                  type: 'string',
                  description: 'Sim card role.',
                },
                validationUrl: {
                  type: 'string',
                  description: 'URL to use validation ESIM request.',
                },
                primary: {
                  type: 'boolean',
                  description: 'Indicates its the primary sim card.',
                },
                active: {
                  type: 'boolean',
                  description: 'Indicates the sim card is active or not.',
                },
                esim: {
                  type: 'boolean',
                  description: 'Indicates the sim card is esim or not.',
                },
              },
            },
          },
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

  /**
   * Get the uri key.
   *
   * @return {string}
   */
  uriKey() {
    return 'gf-contract-data-cell';
  }

  /**
   * Dispatch saved event.
   *
   * @param {Object} request
   * @param {Object} model
   * @return {Promise<void>}
   */
  async saved(request, model) {
    const section = await GfSection.findByCode(SERVICE.CELL);
    const { state } = await GfContractSectionStatusService.getState(
      model.get('contractId'),
      section.id,
    );

    if (state === SECTION_STATUS.EMPTY) {
      await GfContractSectionStatusService.setPendingState(
        model.get('contractId'),
        section.id,
        request.user.userId,
      );
    }

    await GfContractSectionStatusService.execute(
      model.get('contractId'),
      section.id,
      request.user.userId,
    );
  }

  /**
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [
      new SyncState().standalone(),
      new AddAireBonus().inline(),
      new AddAireRoamingBonus(),
      new CancelAireRoamingBonus(),
      new SetMaximumConsumption().inline(),
      new AssignSecondarySim(),
      new RevokeSecondarySim(),
      new RevokeSecondarySim(),
      new ExchangeSimCard(),
      new RevokeEsimRequest(),
      new ResendValidationCode(),
      new ToggleSimState(),
      new ConfigureSecondarySim(),
    ];
  }
};
