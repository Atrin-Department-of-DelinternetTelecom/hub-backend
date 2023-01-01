'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GfCapexType = sequelize.define(
    'GfCapexType',
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
      name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      global: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      troncal: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      user: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      supplier: {
        type: DataTypes.ENUM(
          'adamo',
          'electra',
          'guifi.net',
          'apfutura',
          'emagina',
          'technoso',
          'movistar',
          'neba',
          'capa8',
          '4GOrange',
          'nose',
          'aire',
          'cittec',
          'byfi',
        ),
        allowNull: true,
      },
      transit: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      transport: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      support: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      guifi: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      estructZona: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'gf_capex_types',
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

  GfCapexType.associate = function (models) {
    GfCapexType.hasMany(models.GfFee, {
      foreignKey: 'internetCapexType',
      as: 'gf_fees',
    });
  };

  return GfCapexType;
};
