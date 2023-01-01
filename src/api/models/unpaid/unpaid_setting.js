'use strict';
const { Model } = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = (sequelize, DataTypes) => {
  class UnpaidSetting extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      UnpaidSetting.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'creator',
      });
    }
  }

  UnpaidSetting.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      disabled_notifiers: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fallback_sms_count: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      msg_period: {
        type: DataTypes.INTEGER,
      },
      msgs_per_period: {
        type: DataTypes.INTEGER,
      },
      msg_hour: {
        type: DataTypes.DATE,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      uid: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: config.get('index.intranet.uid'),
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      creationDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updateDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'UnpaidSetting',
      tableName: 'unpaid_settings',
      schema: config.get('index.sequelize.intranet.database'),
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
      },
    },
  );
  return UnpaidSetting;
};
