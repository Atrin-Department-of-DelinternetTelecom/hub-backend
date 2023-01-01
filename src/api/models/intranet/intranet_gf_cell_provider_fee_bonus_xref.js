'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
module.exports = function (sequelize, DataTypes) {
  const GfCellProviderFeeBonusXref = sequelize.define(
    'GfCellProviderFeeBonusXref',
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
      providerBonusId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      providerFeeId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      providerId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      autoRenewable: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      basicFee: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
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
      tableName: 'gf_cell_provider_fee_bonus_xref',
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

  GfCellProviderFeeBonusXref.associate = function (models) {};

  return GfCellProviderFeeBonusXref;
};
