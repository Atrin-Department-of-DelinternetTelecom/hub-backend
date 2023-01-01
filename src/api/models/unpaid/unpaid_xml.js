'use strict';
const { Model } = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = (sequelize, DataTypes) => {
  class UnpaidXml extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      UnpaidXml.belongsTo(models.UnpaidTemplate, {
        foreignKey: 'template_id',
        as: 'template',
      });
      UnpaidXml.belongsTo(models.UnpaidInvoice, {
        foreignKey: 'invoice_id',
        as: 'invoice',
      });
      UnpaidXml.belongsTo(models.File, {
        foreignKey: 'file_id',
        as: 'xml_document',
      });
    }
  }
  UnpaidXml.init(
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      auto_execute: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      executed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      template_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      file_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      send_method: {
        type: DataTypes.ENUM('sms', 'telegram', 'whatsapp', 'email'),
        defaultValue: 'whatsapp',
      },
      message_template: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      invoice_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      email_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      msg_period: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      msgs_per_period: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      msg_hour: {
        type: DataTypes.DATE,
      },
      xml_file: {
        type: DataTypes.STRING,
        defaultValue: ' ',
      },
      unpaid_fee: {
        type: DataTypes.DECIMAL,
        defaultValue: 7.5,
      },
      start_sending_time: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      total_invoices: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      uid: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        defaultValue: config.get('index.intranet.uid'),
      },
      provider_name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      filename: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
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
      modelName: 'UnpaidXml',
      tableName: 'unpaid_xmls',
      schema: config.get('index.sequelize.intranet.database'),
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
      },
    },
  );

  UnpaidXml.bucket = () => 'unpaid/xml';

  return UnpaidXml;
};
