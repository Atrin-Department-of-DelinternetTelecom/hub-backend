'use strict';
const { Model, Op } = require('sequelize');
const config = require('@config');
const intranet = require('@utils/intranet');

module.exports = (sequelize, DataTypes) => {
  class UnpaidInvoice extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      UnpaidInvoice.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'creator',
      });
      UnpaidInvoice.belongsTo(models.GfInvoiceInvoice, {
        foreignKey: 'invoice_id',
        as: 'invoice',
      });
      UnpaidInvoice.belongsTo(models.UnpaidXml, {
        foreignKey: 'xml_id',
        as: 'xml',
      });
      UnpaidInvoice.belongsTo(models.UnpaidTemplate, {
        foreignKey: 'template_id',
        as: 'template_record',
      });
      UnpaidInvoice.hasMany(models.UnpaidOperatorNotification, {
        foreignKey: 'invoice_id',
        as: 'operation_notification',
      });
      UnpaidInvoice.hasMany(models.UnpaidNotification, {
        foreignKey: 'invoice_id',
        as: 'notifications',
      });
      UnpaidInvoice.belongsTo(models.GfClient, {
        foreignKey: 'client_id',
        as: 'client',
      });
      UnpaidInvoice.belongsTo(models.InvoicePaymentType, {
        foreignKey: 'payment_type_id',
        as: 'payment_type',
      });
      UnpaidInvoice.belongsTo(models.GfInvoiceInvoice, {
        foreignKey: 'invoice_commission_id',
        as: 'invoice_commission',
      });
    }
  }

  UnpaidInvoice.init(
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
      client_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      invoice_date: {
        type: DataTypes.DATE,
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
      unpaid_fee: {
        type: DataTypes.DECIMAL,
      },
      xml_id: {
        type: DataTypes.BIGINT.UNSIGNED,
      },
      template_id: {
        type: DataTypes.BIGINT.UNSIGNED,
      },
      template: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      generated_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      fallback_sms_counter: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      exception: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      invoice_status: {
        type: DataTypes.ENUM('paid', 'issued', 'unpaid', 'canceled', 'cutted'),
      },
      send_method: {
        type: DataTypes.ENUM('sms', 'telegram', 'whatsapp', 'email'),
      },
      cut_date: {
        type: DataTypes.DATE,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      event_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      invoice_commission_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      pay_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      payment_type_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      payment_bank_name: {
        type: DataTypes.STRING(255),
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
      modelName: 'UnpaidInvoice',
      tableName: 'unpaid_invoices',
      schema: config.get('index.sequelize.intranet.database'),
      timestamps: true,
      createdAt: 'creationDate',
      updatedAt: 'updateDate',
      defaultScope: {
        ...intranet.defaultScope,
      },
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [
            {
              name: 'id',
            },
          ],
        },
        {
          name: 'unpaid_invoices_invoice_id_unique_index',
          using: 'BTREE',
          fields: [
            {
              name: 'invoice_id',
            },
          ],
        },
      ],
    },
  );

  UnpaidInvoice.searchClientInfo = async (value) => {
    const likeString = `%${value.replace(/%/g, '')}%`;
    return {
      key: Op.or,
      where: {
        client_id: {
          [Op.like]: likeString,
        },
        '$client.name$': {
          [Op.like]: likeString,
        },
        '$client.emailAddress$': {
          [Op.like]: likeString,
        },
      },
    };
  };

  return UnpaidInvoice;
};
