'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const AnvizStaff = sequelize.define(
    'AnvizStaff',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      anviz_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      user_hardware_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      creator_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
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
      tableName: 'hrms_anviz_staff',
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

  AnvizStaff.associate = function (models) {
    AnvizStaff.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    AnvizStaff.belongsTo(models.Anviz, { foreignKey: 'anviz_id', as: 'anviz' });
    AnvizStaff.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
  };
  return AnvizStaff;
};
