'use strict';
const { Model } = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = (sequelize, DataTypes) => {
  class UnpaidNotification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      UnpaidNotification.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'creator',
      });
      UnpaidNotification.belongsTo(models.UnpaidInvoice, {
        foreignKey: 'invoice_id',
        as: 'invoice',
      });
      UnpaidNotification.belongsTo(models.GfClient, {
        foreignKey: 'client_id',
        as: 'client',
      });
      UnpaidNotification.belongsTo(models.SmspubliReport, {
        foreignKey: 'provider_message_id',
        as: 'provider_message',
      });
      // task_id
      // client_id
    }
  }

  UnpaidNotification.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      invoice_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      client_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      task_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      send_method: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      send_status: {
        type: DataTypes.ENUM('sent', 'pending', 'error', 'canceled'),
        defaultValue: 'pending',
      },
      to: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sent_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      send_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_by_retry: {
        type: DataTypes.BOOLEAN,
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
      provider_message_id: {
        type: DataTypes.STRING,
        allowNull: true,
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
      modelName: 'UnpaidNotification',
      tableName: 'unpaid_notifications',
      schema: config.get('index.sequelize.intranet.database'),
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
      },
    },
  );
  return UnpaidNotification;
};
