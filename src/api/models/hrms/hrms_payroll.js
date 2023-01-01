'use strict';

const Sequelize = require('sequelize');
const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const Payroll = sequelize.define(
    'Payroll',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      salary: {
        type: DataTypes.DOUBLE(8, 2),
        allowNull: false,
      },
      employee_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      template_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      company_signature_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      employee_signature_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      employee_signature_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      company_signature_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      payment_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      pdf_image_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'readyToPay', 'paid', 'cancel'),
        allowNull: false,
        defaultValue: 'pending',
      },
      details: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reject_payment: {
        type: DataTypes.TEXT,
        allowNull: true,
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
      tableName: 'hrms_payroll',
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

  Payroll.associate = function (models) {
    Payroll.belongsTo(models.User, { foreignKey: 'creator_id', as: 'creator' });
    Payroll.belongsTo(models.User, {
      foreignKey: 'employee_id',
      as: 'employee',
    });
    Payroll.belongsTo(models.File, {
      foreignKey: 'company_signature_id',
      as: 'company_signature',
    });
    Payroll.belongsTo(models.File, {
      foreignKey: 'employee_signature_id',
      as: 'employee_signature',
    });
    Payroll.belongsTo(models.File, {
      foreignKey: 'payment_id',
      as: 'attachment',
    });
    Payroll.belongsTo(models.Template, {
      foreignKey: 'template_id',
      as: 'template',
    });
    Payroll.belongsTo(models.File, {
      foreignKey: 'pdf_image_id',
      as: 'pdf_image',
    });
  };
  return Payroll;
};
