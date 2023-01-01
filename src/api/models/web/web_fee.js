'use strict';

const { Model } = require('sequelize');
const config = require('@config');

module.exports = (sequelize, DataTypes) => {
  class Fee extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Fee.belongsTo(models.User, { foreignKey: 'creator_id', as: 'creator' });
      Fee.belongsTo(models.Section, {
        foreignKey: 'section_id',
        as: 'section',
      });
      Fee.belongsTo(models.GfFeeGroup, {
        foreignKey: 'fee_group_id',
        as: 'fee_group',
      });
      Fee.hasMany(models.Text, {
        foreignKey: 'locator_id',
        constraints: false,
        scope: {
          locator_type: 'fee',
        },
        as: 'texts',
      });
    }
  }

  Fee.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      fee_group_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      section_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      weight: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
      default: {
        allowNull: true,
        type: DataTypes.INTEGER,
      },
      creator_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'Fee',
      tableName: 'web_fees',
      timestamps: true,
      paranoid: true,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
    },
  );

  return Fee;
};
