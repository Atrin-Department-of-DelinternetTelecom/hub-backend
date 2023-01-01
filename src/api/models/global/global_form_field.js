'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const FormField = sequelize.define(
    'FormField',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      metadata: {
        allowNull: true,
        type: DataTypes.TEXT,
        get: function () {
          return JSON.parse(this.getDataValue('metadata') || '[]');
        },
        set: function (value) {
          this.setDataValue('metadata', JSON.stringify(value));
        },
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      value: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      type: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      form_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      creator_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'global_form_fields',
      timestamps: true,
      paranoid: true,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
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
  FormField.associate = function (models) {
    FormField.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
    FormField.belongsTo(models.Form, {
      foreignKey: 'form_id',
      as: 'form',
    });
  };
  return FormField;
};
