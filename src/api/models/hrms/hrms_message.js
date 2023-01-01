'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const Message = sequelize.define(
    'Message',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      creator_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      from_user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      to_user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      read: {
        allowNull: true,
        type: DataTypes.BOOLEAN,
      },
      filter: {
        allowNull: true,
        type: DataTypes.INTEGER,
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
      tableName: 'hrms_message',
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

  Message.associate = function (models) {
    Message.belongsTo(models.User, { foreignKey: 'creator_id', as: 'creator' });
    Message.belongsTo(models.User, {
      foreignKey: 'from_user_id',
      as: 'from_user',
    });
    Message.belongsTo(models.User, { foreignKey: 'to_user_id', as: 'to_user' });
  };

  return Message;
};
