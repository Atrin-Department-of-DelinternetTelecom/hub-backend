'use strict';

const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const Faq = sequelize.define(
    'Faq',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      answer: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      creator_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
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
      tableName: 'hrms_faq',
      timestamps: true,
      underscored: true,
      paranoid: true,
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

  Faq.associate = function (models) {
    Faq.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
  };

  return Faq;
};
