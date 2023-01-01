'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const FormCategory = sequelize.define(
    'FormCategory',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      current_version_form_template_id: {
        allowNull: true,
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
      tableName: 'global_form_categories',
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
  FormCategory.associate = function (models) {
    FormCategory.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });

    FormCategory.belongsTo(models.FormTemplate, {
      foreignKey: 'current_version_form_template_id',
      as: 'current_version',
    });

    FormCategory.hasMany(models.FormTemplate, {
      foreignKey: 'form_category_id',
      as: 'templates',
    });

    FormCategory.hasMany(models.Form, {
      foreignKey: 'form_category_id',
      as: 'forms',
    });

    FormCategory.hasMany(models.FormTag, {
      foreignKey: 'form_category_id',
      as: 'tags',
    });
  };
  return FormCategory;
};
