'use strict';
const { Model } = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = (sequelize, DataTypes) => {
  class UnpaidChangeFeeNotification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      UnpaidChangeFeeNotification.belongsTo(models.GfFeeGroup, {
        foreignKey: 'old_fee_group_id',
        as: 'old_fee_group',
      });
      UnpaidChangeFeeNotification.belongsTo(models.GfFeeGroup, {
        foreignKey: 'new_fee_group_id',
        as: 'new_fee_group',
      });
      UnpaidChangeFeeNotification.belongsTo(models.GfClient, {
        foreignKey: 'client_id',
        as: 'client',
      });
      UnpaidChangeFeeNotification.belongsTo(models.GfContract, {
        foreignKey: 'contract_id',
        as: 'contract',
      });
      UnpaidChangeFeeNotification.belongsTo(models.User, {
        foreignKey: 'result_user_id',
        as: 'result_user',
      });
      UnpaidChangeFeeNotification.belongsTo(models.User, {
        foreignKey: 'creator_id',
        as: 'creator',
      });
      UnpaidChangeFeeNotification.hasOne(models.Action, {
        foreignKey: 'model_id',
        constraints: false,
        scope: {
          model_name: 'unpaid_change_fee_notifications',
        },
      });
    }
  }

  UnpaidChangeFeeNotification.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      old_fee_group_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      new_fee_group_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      client_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      contract_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      to: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      send_method: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      send_date: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      send_status: {
        type: DataTypes.ENUM('sent', 'pending', 'error', 'canceled'),
        defaultValue: 'pending',
      },
      result: {
        type: DataTypes.ENUM('pending', 'rejected', 'accept'),
        defaultValue: 'pending',
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      metadata: {
        defaultValue: '{}',
        type: DataTypes.TEXT,
        get: function () {
          return JSON.parse(this.getDataValue('metadata') || '{}');
        },
        set: function (value) {
          this.setDataValue('metadata', JSON.stringify(value));
        },
      },
      created_by_retry: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      result_user_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      creator_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
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
      modelName: 'UnpaidChangeFeeNotification',
      tableName: 'unpaid_change_fee_notifications',
      underscored: true,
      schema: config.get('index.sequelize.intranet.database'),
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
      },
    },
  );
  return UnpaidChangeFeeNotification;
};
