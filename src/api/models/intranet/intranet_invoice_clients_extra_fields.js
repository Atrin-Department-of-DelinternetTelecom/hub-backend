'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
module.exports = function (sequelize, DataTypes) {
  const InvoiceClientsExtraField = sequelize.define(
    'InvoiceClientsExtraField',
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
        type: DataTypes.STRING,
        allowNull: false,
      },
      explain: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      active: {
        type: DataTypes.INTEGER,
        allowNull: true,
        default: false,
      },
      label: {
        allowNull: true,
        type: DataTypes.TEXT,
        get() {
          const label = this.getDataValue('label');
          return label
            ? JSON.parse(this.getDataValue('label'))
            : InvoiceClientsExtraField.defaultLabels();
        },
        set(value) {
          this.setDataValue(
            'label',
            JSON.stringify(
              value ? value : InvoiceClientsExtraField.defaultLabels(),
            ),
          );
        },
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      comment_required: {
        type: DataTypes.INTEGER,
        default: 0,
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
      tableName: 'invoice_clients_extra_fields',
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

  InvoiceClientsExtraField.associate = function (models) {
    InvoiceClientsExtraField.belongsTo(
      models.InvoiceClientsExtraFieldsCategory,
      {
        foreignKey: 'categoryId',
        as: 'category',
      },
    );

    InvoiceClientsExtraField.hasMany(models.InvoiceClientExtraFieldXref, {
      foreignKey: 'extraFieldId',
      as: 'clients',
    });

    InvoiceClientsExtraField.hasMany(models.GfCrmEventClientTag, {
      foreignKey: 'extraFieldId',
      as: 'crmEvents',
    });

    InvoiceClientsExtraField.belongsToMany(models.InvoiceClient, {
      through: models.InvoiceClientExtraFieldXref,
      foreignKey: 'extraFieldId',
      otherKey: 'clientId',
    });
  };

  InvoiceClientsExtraField.defaultLabels = () => {
    return { en: null, es: null, ca: null };
  };

  return InvoiceClientsExtraField;
};
