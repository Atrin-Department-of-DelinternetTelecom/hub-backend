'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const gfBonosFixValues = sequelize.define(
    'GfBonosFixValues',
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
      bonoId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      fixTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      minutes: {
        type: DataTypes.DECIMAL(11, 2),
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
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
      tableName: 'gf_bonos_fix_values',
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
        {
          name: 'feeId',
          using: 'BTREE',
          fields: [
            {
              name: 'feeId',
            },
          ],
        },
        {
          name: 'status',
          using: 'BTREE',
          fields: [
            {
              name: 'status',
            },
          ],
        },
        {
          name: 'uid',
          using: 'BTREE',
          fields: [
            {
              name: 'uid',
            },
          ],
        },
      ],
    },
  );

  gfBonosFixValues.associate = function (models) {
    gfBonosFixValues.belongsTo(models.GfBonus, {
      foreignKey: 'bonoId',
      as: 'bonus',
    });

    gfBonosFixValues.belongsTo(models.GfFixCallTypes, {
      foreignKey: 'fixTypeId',
      as: 'fixType',
    });
  };

  return gfBonosFixValues;
};
