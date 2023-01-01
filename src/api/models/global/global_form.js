'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const Form = sequelize.define(
    'Form',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      owner_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      form_template_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      form_category_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
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
      tableName: 'global_forms',
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
  Form.associate = function (models) {
    Form.belongsTo(models.User, {
      foreignKey: 'owner_id',
      as: 'owner',
    });

    Form.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });

    Form.belongsTo(models.FormTemplate, {
      foreignKey: 'form_template_id',
      as: 'form_template',
    });

    Form.belongsTo(models.FormCategory, {
      foreignKey: 'form_category_id',
      as: 'form_category',
    });

    Form.hasMany(models.FormField, {
      foreignKey: 'form_id',
      as: 'form_fields',
    });
  };
  return Form;
};
