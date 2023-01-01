import config from '@config';
import { AnyModel, DatabaseModels } from '@models';
import intranet from '@utils/intranet';
import { DataTypes, Model, Sequelize } from 'sequelize';

export const addressFields = [
  'addressRegion',
  'addressRegionCode',
  'addressRegionCodeName',
  'addressProvince',
  'addressProvinceCode',
  'addressProvinceCodeName',
  'addressCity',
  'addressCityCode',
  'addressCityCodeName',
  'addressPostalCode',
  'addressPostalCodeCode',
  'addressPostalCodeCodeName',
  'addressStreet',
  'addressStreetCode',
  'addressStreetCodeName',
  'addressStreetTypeCode',
  'addressStreetTypeCodeName',
  'addressNumber',
  'addressNumberCode',
  'addressNumberCodeName',
  'addressFloor',
  'addressFloorCode',
  'addressFloorCodeName',
  'addressBuilding',
  'addressBuildingCode',
  'addressBuildingCodeName',
  'addressDoor',
  'addressDoorCode',
  'addressDoorCodeName',
  'addressStairway',
  'addressStairwayCode',
  'addressStairwayCodeName',
  'addressLat',
  'addressLng',
] as const;

export class GfSimDelivery extends Model {
  declare id: number;
  declare uid: number;
  declare clientId: number;
  declare contractId: number;
  declare closed: boolean;
  declare status: boolean;
  declare date: Date;
  declare technicianUserId: number;

  declare userId: number;
  declare creationDate: Date;
  declare updateDate: Date;

  declare contract: AnyModel;
  declare client: AnyModel;

  static associate(models: DatabaseModels) {
    GfSimDelivery.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    GfSimDelivery.belongsTo(models.GfClient, {
      foreignKey: 'clientId',
      as: 'client',
    });
    GfSimDelivery.belongsTo(models.GfUser, {
      foreignKey: 'technicianUserId',
      targetKey: 'userId',
      as: 'technicianUser',
    });
  }
}

export function init(sequelize: Sequelize) {
  GfSimDelivery.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: config.get('index.intranet.uid'),
      },
      clientId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      closed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      technicianUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      ...Object.fromEntries(
        addressFields.map((key) => [
          key,
          {
            type: DataTypes.STRING,
            allowNull: true,
          },
        ]),
      ),
    },
    {
      sequelize,
      tableName: 'gf_sim_deliveries',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',

      defaultScope: { ...intranet.defaultScope },
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

  return GfSimDelivery;
}
