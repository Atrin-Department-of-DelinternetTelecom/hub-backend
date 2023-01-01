'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');
module.exports = function (sequelize, DataTypes) {
  const GfContractsBonus = sequelize.define(
    'GfContractsBonus',
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
      contractId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      sectionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      bonusId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      autoRenew: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      dateUp: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      dateDown: {
        type: DataTypes.DATE,
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
      tableName: 'gf_contracts_bonus',
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

  GfContractsBonus.associate = function (models) {
    GfContractsBonus.belongsTo(models.GfContract, {
      foreignKey: 'contractId',
      as: 'contract',
    });
    GfContractsBonus.belongsTo(models.GfSection, {
      foreignKey: 'sectionId',
      as: 'section',
    });
  };

  return GfContractsBonus;
};
