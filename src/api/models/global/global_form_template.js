'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const FormTemplate = sequelize.define(
    'FormTemplate',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      form_object: {
        allowNull: false,
        type: DataTypes.TEXT,
        get: function () {
          return JSON.parse(this.getDataValue('form_object') || '[]');
        },
        set: function (value) {
          this.setDataValue('form_object', JSON.stringify(value));
        },
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      creator_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      form_category_id: {
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
      tableName: 'global_form_templates',
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

  FormTemplate.associate = function (models) {
    FormTemplate.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });

    FormTemplate.belongsTo(models.FormCategory, {
      foreignKey: 'form_category_id',
      as: 'form_category',
    });

    FormTemplate.hasMany(models.Form, {
      foreignKey: 'form_template_id',
      as: 'forms',
    });
  };
  return FormTemplate;
};
