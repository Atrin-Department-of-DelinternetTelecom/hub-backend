'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
module.exports = function (sequelize, DataTypes) {
  const InvoiceClientExtraFieldXref = sequelize.define(
    'InvoiceClientExtraFieldXref',
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
      clientId: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      extraFieldId: {
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
      tableName: 'invoice_clients_extra_fields_xref',
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

  InvoiceClientExtraFieldXref.associate = function (models) {
    InvoiceClientExtraFieldXref.belongsTo(models.InvoiceClientsExtraField, {
      foreignKey: 'extraFieldId',
      as: 'extraField',
    });
    InvoiceClientExtraFieldXref.belongsTo(models.InvoiceClient, {
      foreignKey: 'clientId',
      as: 'client',
    });
  };

  return InvoiceClientExtraFieldXref;
};
