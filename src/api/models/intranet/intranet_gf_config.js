'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');
const _ = require('lodash');

module.exports = function (sequelize, DataTypes) {
  const GfConfig = sequelize.define(
    'GfConfig',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: config.get('index.intranet.uid'),
      },
      invoiceDay: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      invoiceMonths: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      invoiceSerieId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      iva: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      devolutionComission: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      aireKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      aireEndPoint: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      aireUser: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      airePassword: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      kamailioKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      kamailioEndPoint: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      phicusUser: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      phicusPassword: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      phicusEndPoint: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      radiusHost: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      radiusUser: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      radiusPassword: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      radiusDbName: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      radiusServerApi: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      radiusServerKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      radiusHeaderTag: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      radApiSeed: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      useExternalErp: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      extType: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      extUser: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      extPassword: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      extEndPoint: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      logo: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      tagIdForIncidenceWithAssistance: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      lemonFtp: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      lemonUser: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      lemonPass: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      lemonPrefix: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      useCasandraForMobileCdr: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      webOrderClientTags: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'gf_config',
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
          fields: [
            {
              name: 'id',
            },
          ],
        },
      ],
    },
  );

  GfConfig.associate = function (models) {};

  return GfConfig;
};
