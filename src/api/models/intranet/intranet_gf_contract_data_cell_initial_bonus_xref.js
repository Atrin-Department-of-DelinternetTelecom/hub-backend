'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');
module.exports = function (sequelize, DataTypes) {
  const GfContractDataCellInitialBonusXref = sequelize.define(
    'GfContractDataCellInitialBonusXref',
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
      dataCellId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      aireBonoId: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      tableName: 'gf_contract_data_cell_initial_bonus_xref',
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

  GfContractDataCellInitialBonusXref.associate = function (models) {
    GfContractDataCellInitialBonusXref.belongsTo(models.GfContractDataCell, {
      foreignKey: 'dataCellId',
      as: 'dataCell',
    });
  };

  return GfContractDataCellInitialBonusXref;
};
