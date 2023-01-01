//@ts-check
'use strict';

const config = require('@config');
const intranet = require('@utils/intranet');
module.exports = function (sequelize, DataTypes) {
  const InvoiceClientsExtraFieldsCategory = sequelize.define(
    'InvoiceClientsExtraFieldsCategory',
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
      label: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
          const label = this.getDataValue('label');
          return label
            ? JSON.parse(this.getDataValue('label'))
            : InvoiceClientsExtraFieldsCategory.defaultLabels();
        },
        set(value) {
          this.setDataValue(
            'label',
            JSON.stringify(
              value ? value : InvoiceClientsExtraFieldsCategory.defaultLabels(),
            ),
          );
        },
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        default: false,
      },
      required: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        default: false,
      },
      multiple: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        default: false,
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
      tableName: 'invoice_clients_extra_fields_categories',
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

  InvoiceClientsExtraFieldsCategory.associate = function (models) {
    InvoiceClientsExtraFieldsCategory.hasMany(models.InvoiceClientsExtraField, {
      foreignKey: 'categoryId',
      as: 'extraFields',
    });
  };

  InvoiceClientsExtraFieldsCategory.defaultLabels = () => {
    return { en: null, es: null, ca: null };
  };

  return InvoiceClientsExtraFieldsCategory;
};
