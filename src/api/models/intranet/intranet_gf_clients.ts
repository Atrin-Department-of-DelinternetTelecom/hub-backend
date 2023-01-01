import { AnyModel, DatabaseModels } from '@models';
import { Model, Op, Sequelize, literal } from 'sequelize';

import { CreateClient } from '@del-internet/lemon';
import GfClientFields from '@resources/intranet/fields/GfClient';
import { HttpError } from '@api/http/http_errors';
import { LemonAddressMapping } from './intranet_lemon_address_mapping';
import { ErrorStatus, Status } from '@api/http/http_status';
import assert from 'assert';
import config from '@config';
import { defaultScope } from '@utils/intranet';
import { deleteFile } from '@api/service/file/fileService';
import moment from 'moment';
import { parse } from 'path';
import { snakeCase } from 'lodash';
import { ADDRESS } from '@api/constants/address';
import { intranet as knex } from '@lib/knex';
import { CONTRACT } from '@api/constants/statuses';
import { firstPopulated, isNullish } from '@api/utils/helpers';

class WrongLemonAddress extends HttpError {
  type = 'WRONG_LEMON_ADDRESS';

  override get status(): ErrorStatus {
    return Status.UnprocessableEntity;
  }
}

export class GfClient extends Model {
  declare id: number;
  declare uid: number;
  declare imported: number | null;
  declare active: number;
  declare defaulter: number | null;
  declare invoiceClientId: number;
  declare userId: number;
  declare idTpv: string | null;
  declare idOldWeb: number | null;
  declare phicusCustomerId: number | null;
  declare collaboratorId: number | null;
  declare distributorId: number | null;
  declare subscriberTypeId: number | null;
  declare marketingConsent: number | null;
  declare marketingConsentTypeId: number | null;
  declare documentTypeId: number | null;
  declare fiscalId: string;
  declare centreCode: string | null;
  declare requiresFacturae: boolean | number;
  declare nationalityCode: string;
  declare language: string;
  declare name: string;
  declare contactName: string;
  declare contactFamilyName1: string;
  declare contactFamilyName2: string;
  declare birthday: string;
  declare contactDocumentTypeId: number;
  declare contactFiscalId: string;
  declare emailAddress: string;
  declare dontHaveEmail: number;
  declare contactPhone: string;
  declare temporaryAddress: string;
  declare addressRegion: string;
  declare addressProvince: string;
  declare addressProvinceCode: string;
  declare addressProvinceCodeName: string;
  declare addressCity: string;
  declare addressCityCode: string;
  declare addressCityCodeName: string;
  declare addressPostalCode: number;
  declare addressPostalCodeCode: string;
  declare addressPostalCodeCodeName: string;
  declare addressStreet: string;
  declare addressStreetCode: string;
  declare addressStreetCodeName: string;
  declare addressStreetTypeCode: string;
  declare addressStreetTypeCodeName: string;
  declare addressNumber: string;
  declare addressNumberCode: string;
  declare addressNumberCodeName: string;
  declare addressFloor: string;
  declare addressFloorCode: string;
  declare addressFloorCodeName: string;
  declare addressBuilding: string;
  declare addressBuildingCode: string;
  declare addressBuildingCodeName: string;
  declare addressDoor: string;
  declare addressDoorCode: string;
  declare addressDoorCodeName: string;
  declare addressStairway: string;
  declare addressStairwayCode: string;
  declare addressStairwayCodeName: string;
  declare addressLat: string;
  declare addressLng: string;
  declare addressMapUrl: string;
  declare useGoogleMaps: number;
  declare useAdressForShipping: number;
  declare shippingAddressRegion: string;
  declare shippingAddressProvince: string;
  declare shippingAddressCity: string;
  declare shippingAddressPostalCode: string;
  declare shippingAddressStreet: string;
  declare shippingAddressNumber: string;
  declare shippingAddressDescription: string;
  declare document: string;
  declare iban: string;
  declare bic: string;
  declare bicName: string;
  declare isRemitance: number;
  declare paymentTypeId: number;
  declare myGoufoneDisabled: number;
  declare noBillable: number;
  declare payDay: number;
  declare sepaName: string;
  declare sepaSurname1: string;
  declare sepaSurname2: string;
  declare sepaFiscalTypeId: number;
  declare sepaFiscalId: string;
  declare aireCode: string;
  declare lastAireError: string;
  declare lastExtErpError: string;
  declare status: number;
  declare creationDate: Date;
  declare updateDate: Date;
  // relationships
  declare contracts?: AnyModel[];
  declare subscriberType?: AnyModel;
  declare documentType?: AnyModel;
  declare contactDocumentType?: AnyModel;
  declare nationality?: AnyModel;
  declare invoiceClient?: AnyModel;
  declare extraFields?: AnyModel[];
  declare user?: AnyModel;
  declare paymentType?: AnyModel;
  declare exists_on_lemon: boolean;

  static associate(models: DatabaseModels) {
    GfClient.hasMany(models.GfContract, {
      foreignKey: 'clientId',
      as: 'contracts',
    });
    GfClient.belongsTo(models.GfSubscriberType, {
      foreignKey: 'subscriberTypeId',
      as: 'subscriberType',
    });
    GfClient.belongsTo(models.GfDocumentType, {
      foreignKey: 'documentTypeId',
      as: 'documentType',
    });
    GfClient.belongsTo(models.GfDocumentType, {
      foreignKey: 'contactDocumentTypeId',
      as: 'contactDocumentType',
    });
    GfClient.belongsTo(models.Country, {
      foreignKey: 'nationalityCode',
      targetKey: 'isoCode',
      as: 'nationality',
    });
    GfClient.belongsTo(models.InvoiceClient, {
      foreignKey: 'invoiceClientId',
      as: 'invoiceClient',
    });
    GfClient.belongsToMany(models.InvoiceClientsExtraField, {
      through: {
        model: models.InvoiceClientExtraFieldXref,
        scope: defaultScope?.where ?? {},
      },
      foreignKey: 'clientId',
      otherKey: 'extraFieldId',
      as: 'extraFields',
    });
    GfClient.belongsTo(models.GfUser, {
      foreignKey: 'userId',
      targetKey: 'userId',
      as: 'user',
    });
    GfClient.belongsTo(models.GfCollaborator, {
      foreignKey: 'collaboratorId',
      as: 'collaborator',
    });
    GfClient.belongsTo(models.InvoicePaymentType, {
      as: 'paymentType',
    });
  }

  fullName() {
    return this.name ?? this.buildFullName();
  }

  buildFullName() {
    return [this.contactName, this.contactFamilyName1, this.contactFamilyName2]
      .filter((val) => val)
      .join(' ');
  }

  /**
   * Determine document column  is not blank.
   *
   * @return {Boolean} [description]
   */
  hasDocument() {
    return !!this.getDocument();
  }

  /**
   * Get document file name.
   *
   * @return boolean
   */
  getDocument() {
    return this.document;
  }

  /**
   * Delete old document if exists
   */
  async deleteOldDocument() {
    if (this.previous('document')) {
      await deleteFile(this.previous('document'), GfClient.documentBucket);
    }
  }

  async deleteDocument() {
    if (this.document) {
      await deleteFile(this.document, GfClient.documentBucket);
    }
  }

  get downloadName(): string {
    const { ext } = parse(this.document);
    const name = snakeCase(`gfClient_document_${this.id}_${this.name}`);

    return `${name}${ext}`;
  }

  static get documentBucket(): string {
    return 'GfClient/Document';
  }

  transferConfig() {
    return {
      attribute: 'document',
      path: `mooisp/content1/clients/documents/${this.id}`,
      bucket: GfClient.documentBucket,
    };
  }

  /**
   * Determin if client is active.
   *
   * @return string
   */
  isActive() {
    return !!this.active && !!this.iban && !!this.contactPhone;
  }

  hasValidBankData(): boolean {
    return !isNullish(this.iban);
  }

  static searchName(value: string) {
    const likeString = `%${value.replace(/\s+/g, ' %').replace('%', '')}%`;

    return {
      key: Op.or,
      where: {
        name: {
          [Op.like]: likeString,
        },
      },
    };
  }

  static searchAddress(value: string) {
    const likeString = `%${value.replace('%', '')}%`;

    return {
      key: Op.or,
      where: {
        fiscalId: {
          [Op.like]: likeString,
        },
        addressStreet: {
          [Op.like]: likeString,
        },
        addressNumber: {
          [Op.like]: likeString,
        },
        addressCity: {
          [Op.like]: likeString,
        },
        addressPostalCode: {
          [Op.like]: likeString,
        },
      },
    };
  }

  static async searchContact(value: string) {
    const likeString = `%${value}%`;

    return {
      key: Op.or,
      where: {
        contactPhone: {
          [Op.like]: likeString,
        },
        emailAddress: {
          [Op.like]: likeString,
        },
      },
    };
  }

  static findByContractId(contractId: number) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { GfContract } = require('@models').intranet;

    return GfClient.findOne({
      include: [
        {
          model: GfContract,
          as: 'contracts',
          required: true,
          where: {
            id: contractId,
          },
        },
      ],
    });
  }

  static async searchBusiness() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { GfSubscriberType } = require('@models').intranet;
    const subscriberType = await GfSubscriberType.findOne({
      where: {
        aireNetworksCode: config.get('intranet.aireBusinessCode') ?? 1,
      },
    });

    return {
      key: Op.and,
      where: { subscriberTypeId: subscriberType.id },
    };
  }

  static async searchInactives() {
    const subQuery = knex('intranet.gf_contracts AS x')
      .select(1)
      .where('x.status', '=', 1)
      .where('x.clientId', '=', knex.raw('GfClient.id'))
      .where('x.state', 'in', [CONTRACT.ACTIVE, CONTRACT.BLOCKED])
      .limit(1)
      .toQuery();

    return {
      key: Op.and,
      where: [{ active: false }, literal(`EXISTS (${subQuery})`)],
    };
  }

  static async searchCollaborator(value: string) {
    const ref = `ref${Date.now()}`;
    const subQuery = knex(`intranet.gf_collaborators AS ${ref}`)
      .select(1)
      .where(`${ref}.status`, '=', 1)
      .where(`${ref}.id`, '=', knex.raw('GfClient.collaboratorId'))
      .where(`${ref}.name`, 'like', `%${value.replace(/%/g, '')}%`)
      .limit(1)
      .toQuery();

    return {
      key: Op.and,
      where: [literal(`EXISTS (${subQuery})`)],
    };
  }

  /**
   * Serilize for the meiliserach storage.
   */
  toSearchableObject() {
    return {
      id: this.id,
      active: this.isActive(),
      fiscalId: this.fiscalId,
      name: this.name,
      emailAddress: this.emailAddress,
      contactPhone: this.contactPhone,
      address: [
        this.addressProvince,
        this.addressCity,
        this.addressStreet,
        this.addressNumber,
        this.addressPostalCode,
      ]
        .filter((_) => _)
        .join(', '),
      aireCode: this.aireCode,
      extraFields: this.extraFields?.map((extraField) => extraField.name) ?? [],
    };
  }

  async serializeForLemon(): Promise<CreateClient> {
    return {
      fiscalId: this.fiscalId,
      contactFiscalId: this.contactFiscalId,
      name: this.name,
      contactName: this.contactName,
      contactFamilyName1: this.contactFamilyName1,
      contactFamilyName2: this.contactFamilyName2,
      contactPhone: String(firstPopulated([this.contactPhone], '')).slice(-9),
      emailAddress: this.emailAddress,
      addressRegion: (await this.lemonRegion()).lemon_id,
      addressProvince: (await this.lemonProvince()).lemon_id,
      addressCity: (await this.lemonCity()).lemon_id,
      addressStreet: this.addressStreet ?? '',
      addressNumber: this.addressNumber ?? '',
      addressPostalCode: this.addressPostalCode ?? '',
      nationality: this.nationalityCode ?? '',
    };
  }

  async lemonRegion() {
    const region = await LemonAddressMapping.findOne({
      where: {
        lemon_id: { [Op.not]: null },
        name: this.addressRegion,
        type: ADDRESS.REGION,
      },
      attributes: ['lemon_id'],
      raw: true,
    });
    assert(
      region,
      new WrongLemonAddress(`Client region is invalid [${this.addressRegion}]`),
    );

    return region;
  }

  async lemonProvince() {
    const province = await LemonAddressMapping.findOne({
      where: {
        lemon_id: { [Op.not]: null },
        code: this.addressProvinceCode,
        type: ADDRESS.PROVINCE,
      },
      attributes: ['lemon_id'],
      raw: true,
    });

    assert(
      province,
      new WrongLemonAddress(
        `Client province is invalid [${this.addressProvinceCode}]`,
      ),
    );
    return province;
  }

  async lemonCity() {
    const city = await LemonAddressMapping.findOne({
      where: {
        lemon_id: { [Op.not]: null },
        code: this.addressCityCode,
        type: ADDRESS.CITY,
      },
      attributes: ['lemon_id'],
      raw: true,
    });

    assert(
      city,
      new WrongLemonAddress(`Client city is invalid [${this.addressCityCode}]`),
    );
    return city;
  }
}

export function init(sequelize: Sequelize) {
  GfClient.init(new GfClientFields().fieldCollection({}).toSequelizeConfig(), {
    sequelize,
    tableName: 'gf_clients',
    schema: 'intranet',
    timestamps: true,
    createdAt: 'creationDate',
    updatedAt: 'updateDate',
    defaultScope,
    scopes: {
      relationScope: {
        include: [
          'id',
          'name',
          'contactName',
          'contactFamilyName1',
          'contactFamilyName2',
          'fiscalId',
        ],
      },
    },

    hooks: {
      async afterUpdate(model: GfClient) {
        if (model.changed('document')) {
          await model.deleteOldDocument();
        }
      },
      async afterCreate(model) {
        const { CrTask: CrmTask, InvoicePaymentType } =
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          require('@models').intranet;
        // ensure of payment type
        if (!model.paymentTypeId) {
          const { id } = await InvoicePaymentType.defaultPaymentType();

          await GfClient.update(
            { paymentTypeId: id },
            { where: { id: model.id } },
          );
        }
        // ensure of crm task
        const fields = [
          'name',
          'contactName',
          'contactFamilyName1',
          'contactFamilyName2',
          'emailAddress',
        ];

        let aditionalText = "<table class='table'>";
        for (const field of fields) {
          const fieldValue = model[field as keyof GfClient];
          aditionalText += `<tr><td>${field}</td><td>${fieldValue}</td></tr>`;
        }
        aditionalText += '</table>';
        const newCrTask = await CrmTask.create({
          taskTypeId: 11,
          clientId: model.invoiceClientId,
          alias: 'Client created',
          aditionalText,
          userId: model.userId,
          previsionDate: moment().format('YYYY-MM-DD HH:mm:ss'),
        });
        newCrTask.chatId = `crmTask:${newCrTask.id}`;
        await newCrTask.save();
      },
    },

    indexes: [
      {
        name: 'PRIMARY',
        unique: true,
        using: 'BTREE',
        fields: [{ name: 'id' }],
      },
      {
        name: 'active',
        using: 'BTREE',
        fields: [{ name: 'active' }],
      },
      {
        name: 'fiscalId',
        using: 'BTREE',
        fields: [{ name: 'fiscalId' }],
      },
      {
        name: 'name',
        using: 'BTREE',
        fields: [{ name: 'name' }],
      },
      {
        name: 'status',
        using: 'BTREE',
        fields: [{ name: 'status' }],
      },
      {
        name: 'uid',
        using: 'BTREE',
        fields: [{ name: 'uid' }],
      },
      {
        name: 'userId',
        using: 'BTREE',
        fields: [{ name: 'userId' }],
      },
      {
        name: 'collaboratorId',
        using: 'BTREE',
        fields: [{ name: 'collaboratorId' }],
      },
      {
        name: 'distributorId',
        using: 'BTREE',
        fields: [{ name: 'distributorId' }],
      },
      {
        name: 'invoiceClientId',
        using: 'BTREE',
        fields: [{ name: 'invoiceClientId' }],
      },
      {
        name: 'contactFamilyName1',
        using: 'BTREE',
        fields: [{ name: 'contactFamilyName1' }],
      },
      {
        name: 'contactPhone',
        using: 'BTREE',
        fields: [{ name: 'contactPhone' }],
      },
      {
        name: 'emailAddress',
        using: 'BTREE',
        fields: [{ name: 'emailAddress' }],
      },
    ],
  });

  return GfClient;
}
