'use strict';

const intranet = require('@utils/intranet');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const Warehouse = sequelize.define(
    'Warehouse',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        defaultValue: null,
      },
      name: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },

      description: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      address: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      lat: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      lng: {
        type: DataTypes.FLOAT,
        defaultValue: null,
      },
      warehouseSupervisorId: {
        type: DataTypes.INTEGER,
        defaultValue: null,
      },
      warehouseClerkId: {
        type: DataTypes.INTEGER,
        defaultValue: null,
      },
      warehouseSupervisorName: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      warehouseClerkName: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressRegion: {
        type: DataTypes.STRING,
      },
      addressProvince: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressProvinceCode: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressProvinceCodeName: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressCity: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressCityCode: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressCityCodeName: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressPostalCode: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressPostalCodeCode: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressPostalCodeCodeName: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressStreet: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressStreetCode: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressStreetCodeName: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressStreetTypeCode: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressStreetTypeCodeName: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressNumber: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressNumberCode: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressNumberCodeName: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressFloor: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressFloorCode: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressFloorCodeName: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressBuilding: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressBuildingCode: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressBuildingCodeName: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressDoor: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressDoorCode: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressDoorCodeName: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressStairway: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressStairwayCode: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressStairwayCodeName: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressLat: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressLng: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      addressMapUrl: {
        type: DataTypes.STRING(255),
        defaultValue: null,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: config.get('index.intranet.uid'),
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: true,
      },
      updateDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'in_wh_warehouse',
      schema: 'intranet',
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
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

  return Warehouse;
};
