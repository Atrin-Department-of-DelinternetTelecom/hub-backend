import {
  ASSIGNABLE,
  ASSIGNABLE_HISTORY,
  CONTRACT,
  SECTION_STATUS_PENDINGS,
} from '@api/constants/statuses';
import { AnyModel, DatabaseModels } from '@models';
import { Model, Op, Sequelize } from 'sequelize';

import GfContractDataInternetFields from '@resources/intranet/fields/GfContractDataInternet';
import { UserData } from '@api/service/intranet/RadiusApiService';
import { deleteFile } from '@api/service/file/fileService';
import intranet from '@utils/intranet';
import { parse } from 'path';
import { snakeCase } from 'lodash';
import { throwIf } from '@api/utils/helpers';

const IMAGE_COUNTER = 13;

const removeExtraCpeSn = async (
  dataInternet: AnyModel,
  options: Record<string, any> = {},
) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { GfContract } = require('@models').intranet;
  if (!dataInternet.cpeSn) {
    return;
  }

  const sameCpeNumbers = await GfContractDataInternet.findAll({
    where: {
      cpeSn: dataInternet.cpeSn,
      id: { [Op.not]: dataInternet.id },
    },
    include: [
      {
        model: GfContract,
        as: 'contract',
        required: false,
        where: {
          state: { [Op.not]: CONTRACT.ACTIVE },
        },
      },
    ],
  });

  throwIf(
    sameCpeNumbers.length > 5,
    `More than 5 contract [${sameCpeNumbers
      .map(({ id }) => id)
      .join(',')}] with cpeSn "${dataInternet.cpeSn}" found`,
  );

  await Promise.all(
    sameCpeNumbers.map((dataInternet) => {
      return dataInternet.update({ cpeSn: null }, options);
    }),
  );
};

export enum LEVELS {
  L1 = 'level_1',
  L2 = 'level_1',
  L3 = 'level_1',
}

export class GfContractDataInternet extends Model {
  declare id: number;
  declare uid: number;
  declare contractId: number;
  declare ip: string | null;
  declare staticIp: string | null;
  declare mac: string | null;
  declare guifiNetIp: string | null;
  declare IPv6_prefix: string | null;
  declare node: string | null;
  declare nodeRadiusName: string | null;
  declare nodeRadiusPassword: string | null;
  declare radiusProfileSufix: string | null;
  declare lastCoaMessage: string | null;
  declare oldWebNodeName: string | null;
  declare lat: string | null;
  declare lng: string | null;
  declare addressRegion: string | null;
  declare addressRegionCode: string | null;
  declare addressRegionCodeName: string | null;
  declare addressProvince: string | null;
  declare addressProvinceCode: string | null;
  declare addressProvinceCodeName: string | null;
  declare addressCity: string | null;
  declare addressCityCode: string | null;
  declare addressCityCodename: string | null;
  declare addressPostalCode: string | null;
  declare addressPostalCodeCode: string | null;
  declare addressPostalCodeCodeName: string | null;
  declare addressStreet: string | null;
  declare addressStreetCode: string | null;
  declare addressStreetCodeName: string | null;
  declare addressStreetTypeCode: string | null;
  declare addressStreetTypeCodeName: string | null;
  declare addressNumber: string | null;
  declare addressNumberCode: string | null;
  declare addressNumberCodeName: string | null;
  declare addressFloor: string | null;
  declare addressFloorCode: string | null;
  declare addressFloorCodeName: string | null;
  declare addressBuilding: string | null;
  declare addressBuildingCode: string | null;
  declare addressBuildingCodeName: string | null;
  declare addressDoor: string | null;
  declare addressDoorCode: string | null;
  declare addressDoorCodeName: string | null;
  declare addressStairway: string | null;
  declare addressStairwayCode: string | null;
  declare addressStairwayCodeName: string | null;
  declare addressLat: string | null;
  declare addressLng: string | null;
  declare addressMapUrl: string | null;
  declare installationDuration: number; // minutes
  declare instalationDate: Date | null;
  declare installatorUserId: number | null;
  declare installationDone: number | boolean;
  declare installationLevel: LEVELS | null;
  declare radiosIp: string | null;
  declare cpeDsn: string | null;
  declare cpeSn: string | null;
  declare cpeDeviceId: string | null;
  declare cpeModel: string | null;
  declare cpeVoipProfile: string | null;
  declare cpePppoeUsername: string | null;
  declare cpePppoePassword: string | null;
  declare cpeWifiSsid: string | null;
  declare cpeWifiPassword: string | null;
  declare cpeId: number | null;
  declare cpeLineProfile: string | null;
  declare infoRepair: string | null;
  declare invoiced: number | null;
  declare guifiZona: string | null;
  declare guifiLat: string | null;
  declare guifiLon: string | null;
  declare guifiNodeName: string | null;
  declare guifiName: string | null;
  declare guifiUrl: string | null;
  declare signed: string | null;
  declare image1: string | null;
  declare image2: string | null;
  declare image3: string | null;
  declare image4: string | null;
  declare image5: string | null;
  declare image6: string | null;
  declare image7: string | null;
  declare image8: string | null;
  declare image9: string | null;
  declare image10: string | null;
  declare image11: string | null;
  declare image12: string | null;
  declare image13: string | null;
  declare ipv6: string | null;
  declare materialDescription: string | null;
  declare box: string | null;
  declare providerCode: string | null;
  declare status: number;
  declare creationDate: Date;
  declare updateDate: Date;
  declare config_wifi_on_reconfig: number;
  declare state: SECTION_STATUS_PENDINGS;

  declare contract?: AnyModel;
  declare installatorUser?: AnyModel;
  declare dataFixes?: AnyModel[];

  static associate(models: DatabaseModels) {
    GfContractDataInternet.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    GfContractDataInternet.belongsTo(models.GfUser, {
      foreignKey: 'installatorUserId',
      targetKey: 'userId',
      as: 'installatorUser',
    });
    GfContractDataInternet.belongsTo(models.User, {
      foreignKey: 'installatorUserId',
      targetKey: 'userId',
      as: 'technician',
    });
    GfContractDataInternet.hasMany(models.GfContractDataFix, {
      foreignKey: 'internetSectionId',
      sourceKey: 'contractId',
      as: 'dataFixes',
    });
    GfContractDataInternet.belongsToMany(models.User, {
      as: 'coWorkers',
      through: 'installation_co_workers',
      foreignKey: 'gf_contract_data_internet_id',
      otherKey: 'user_id',
      timestamps: false,
    });
  }

  static imageName(image: number) {
    return `image${image}`;
  }

  getImage(image: number) {
    return this.getDataValue(GfContractDataInternet.imageName(image));
  }

  downloadName(image: number): string {
    const { ext } = parse(this.getImage(image));
    const name = snakeCase(
      `gfClient_document_${this.contractId}_image_${image}`,
    );

    return `${name}${ext}`;
  }

  static get bucket(): string {
    return 'GfContractDataInternet/Image';
  }

  /**
   * Delete old document if exists
   */
  async deleteOldImage(image: number) {
    const imageName = GfContractDataInternet.imageName(image);
    if (this.previous(imageName)) {
      await deleteFile(this.previous(imageName), GfContractDataInternet.bucket);
    }
  }

  async deleteImage(image: number) {
    if (this.getImage(image)) {
      await deleteFile(this.getImage(image), GfContractDataInternet.bucket);
    }
  }

  static transferFields() {
    return Array.from({ length: 13 }).map((_, index) => `image${index + 1}`);
  }

  transferConfig(field: string) {
    return {
      attribute: field,
      path: `mooisp/content1/internet/${field.substring(5)}/${this.id}`,
      bucket: GfContractDataInternet.bucket,
    };
  }

  hasSameRadiusUser(userInfo: UserData) {
    const { username, password } = userInfo.general;
    const { nodeRadiusName, nodeRadiusPassword } = this;

    return username === nodeRadiusName && password === nodeRadiusPassword;
  }

  async ensureOfIpv6() {
    // already has an IP
    if (this.IPv6_prefix) {
      return;
    }
    // try to assign new IP
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Assignable, AssignableHistory } = require('@models').system;
    const ipv6Prefix = await Assignable.findOne({
      where: {
        state: ASSIGNABLE.ASSIGNABLE,
        type: 'ipv6_prefix',
      },
    });
    // not found free IP
    if (ipv6Prefix === null) {
      return;
    }
    // assign ipv6
    await Promise.all([
      ipv6Prefix.update({ state: ASSIGNABLE.ASSIGNED }),
      GfContractDataInternet.update(
        { IPv6_prefix: ipv6Prefix.value },
        { where: { id: this.id } },
      ),
      AssignableHistory.create({
        contract_id: this.contractId,
        assignable_id: ipv6Prefix.id,
        action_type: ASSIGNABLE_HISTORY.ASSIGNED,
        note: 'AUTO ASSIGNMENT',
        operator_id: 1,
      }),
    ]);
  }

  toSearchableObject() {
    return {
      ip: this.ip ?? null,
      staticIp: this.staticIp ?? null,
      IPv6_prefix: this.IPv6_prefix ?? null,
      nodeRadiusName: this.nodeRadiusName ?? null,
      cpeDsn: this.cpeDsn ?? null,
      cpeDeviceId: this.cpeDeviceId ?? null,
      cpePppoeUsername: this.cpePppoeUsername ?? null,
      address: [
        this.addressProvince,
        this.addressCity,
        this.addressStreet,
        this.addressNumber,
        this.addressPostalCode,
      ]
        .filter((_) => _)
        .join(', '),
    };
  }
}

export function init(sequelize: Sequelize) {
  GfContractDataInternet.init(
    new GfContractDataInternetFields().fieldCollection({}).toSequelizeConfig(),
    {
      sequelize,
      tableName: 'gf_contract_data_internet',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: { ...intranet.defaultScope },
      hooks: {
        afterUpdate: async (model: GfContractDataInternet) => {
          for (let index = 1; index <= IMAGE_COUNTER; index++) {
            if (
              model.changed(
                GfContractDataInternet.imageName(
                  index,
                ) as keyof GfContractDataInternet,
              )
            ) {
              await model.deleteOldImage(index);
            }
          }
        },
        afterCreate: async (model: GfContractDataInternet) => {
          try {
            await model.ensureOfIpv6();
          } catch (error) {
            console.log(error);
          }
        },

        afterSave: async (model, options) => {
          await removeExtraCpeSn(model, options);
        },
      },

      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'id' }],
        },
      ],
    },
  );

  return GfContractDataInternet;
}
