'use strict';
const { Model } = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = (sequelize, DataTypes) => {
  class UnpaidOperatorNotification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      UnpaidOperatorNotification.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'creator',
      });
      UnpaidOperatorNotification.belongsTo(models.UnpaidInvoice, {
        foreignKey: 'invoice_id',
        as: 'invoice',
      });
      UnpaidOperatorNotification.belongsTo(models.User, {
        foreignKey: 'seenby_id',
        as: 'seen_by',
      });
      UnpaidOperatorNotification.belongsTo(models.GfClient, {
        foreignKey: 'client_id',
        as: 'client',
      });
      //related model and model_id
    }
  }
  UnpaidOperatorNotification.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      invoice_code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      invoice_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      creator_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      relatedmodel: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      relatedmodel_id: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      seenby_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      seen_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      seen: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      message: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      client_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
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
      modelName: 'UnpaidOperatorNotification',
      tableName: 'unpaid_operator_notifications',
      schema: config.get('index.sequelize.intranet.database'),
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
      },
    },
  );
  return UnpaidOperatorNotification;
};
