'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = function (sequelize, DataTypes) {
  const InvoiceClientsContact = sequelize.define(
    'InvoiceClientsContact',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
      },
      clientId: {
        // referred into the client `invoiceClientId` column
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      uid: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: config.get('index.intranet.uid'),
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      surname: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      position: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: true,
      },
      updateDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'invoice_clients_contacts',
      schema: 'intranet',
      timestamps: true,
      updatedAt: 'updateDate',
      createdAt: 'creationDate',

      defaultScope: { ...intranet.defaultScope },

      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'id' }],
        },
        {
          name: 'clientIdIndex',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'clientId' }],
        },
        {
          name: 'active',
          using: 'BTREE',
          fields: [{ name: 'active' }],
        },
      ],
    },
  );

  InvoiceClientsContact.associate = function (models) {
    InvoiceClientsContact.belongsTo(models.GfClient, {
      foreignKey: 'clientId',
      targetKey: 'invoiceClientId',
      as: 'client',
    });
  };
  return InvoiceClientsContact;
};
