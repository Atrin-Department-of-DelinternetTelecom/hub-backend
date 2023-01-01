'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GfCrmEventExtraField = sequelize.define(
    'GfCrmEventExtraField',
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
      gfCrmEventId: {
        type: DataTypes.INTEGER,
      },
      crmExtraFieldId: {
        type: DataTypes.INTEGER,
      },
      status: {
        type: DataTypes.BOOLEAN,
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
      tableName: 'gf_crm_events_extra_fields_xref',
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

  GfCrmEventExtraField.associate = function (models) {
    GfCrmEventExtraField.belongsTo(models.GfCrmEvent, {
      foreignKey: 'gfCrmEventId',
      as: 'crmEvent',
    });

    GfCrmEventExtraField.belongsTo(models.CrTaskExtraField, {
      foreignKey: 'crmExtraFieldId',
      as: 'crmExtraField',
    });
  };

  return GfCrmEventExtraField;
};
