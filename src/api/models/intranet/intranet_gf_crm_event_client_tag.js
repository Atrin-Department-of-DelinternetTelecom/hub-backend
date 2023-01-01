'use strict';

const Sequelize = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const GfCrmEventClientTag = sequelize.define(
    'GfCrmEventClientTag',
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
      crmEventId: {
        type: DataTypes.INTEGER,
      },
      extraFieldId: {
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
      tableName: 'gf_crm_events_client_tags_xref',
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

  GfCrmEventClientTag.associate = function (models) {
    GfCrmEventClientTag.belongsTo(models.GfCrmEvent, {
      foreignKey: 'crmEventId',
      as: 'crmEvent',
    });

    GfCrmEventClientTag.belongsTo(models.InvoiceClientsExtraField, {
      foreignKey: 'extraFieldId',
      as: 'clientTag',
    });
  };

  return GfCrmEventClientTag;
};
