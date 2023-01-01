'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const Vacation = sequelize.define(
    'Vacation',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      owner_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      from: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      to: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      template_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      state: {
        type: DataTypes.ENUM(
          'pending',
          'approve',
          'cancel',
          'started',
          'finish',
        ),
        allowNull: false,
        defaultValue: 'pending',
      },
      explain: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      state_by_owner: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 0,
      },
      html_file_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      creator_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      signature_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      sign_doc_file_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      sign_doc_image_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
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
      tableName: 'hrms_vacation',
      timestamps: true,
      paranoid: true,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
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

  Vacation.associate = function (models) {
    Vacation.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
    Vacation.belongsTo(models.User, { foreignKey: 'owner_id', as: 'employee' });
    Vacation.belongsTo(models.File, {
      foreignKey: 'signature_id',
      as: 'signature',
    });
    Vacation.belongsTo(models.File, {
      foreignKey: 'sign_doc_image_id',
      as: 'sign_doc_image',
    });
    Vacation.belongsTo(models.File, {
      foreignKey: 'html_file_id',
      as: 'html_file',
    });
    Vacation.belongsTo(models.Template, {
      foreignKey: 'template_id',
      as: 'template',
    });
    Vacation.belongsTo(models.File, {
      foreignKey: 'sign_doc_file_id',
      as: 'sign_doc',
    });
  };

  return Vacation;
};
