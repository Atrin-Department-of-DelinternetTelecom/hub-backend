'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const CrTaskExtraFieldXref = sequelize.define(
    'CrTaskExtraFieldXref',
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
      taskId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      extraFieldId: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
      tableName: 'crm_tasks_extra_fields_xref',
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
          fields: [
            {
              name: 'id',
            },
          ],
        },
      ],
    },
  );

  CrTaskExtraFieldXref.associate = function (models) {
    CrTaskExtraFieldXref.belongsTo(models.CrTaskExtraField, {
      foreignKey: 'extraFieldId',
      as: 'extra_field',
    });
  };

  return CrTaskExtraFieldXref;
};
