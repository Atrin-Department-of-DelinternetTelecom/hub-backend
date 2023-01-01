'use strict';
const { Model, Sequelize } = require('sequelize');
const config = require('@config');
module.exports = (sequelize, DataTypes) => {
  class ClientAgreement extends Model {
    static associate(models) {
      ClientAgreement.belongsTo(models.GfContract, {
        foreignKey: 'contract_id',
        as: 'contract',
      });
      ClientAgreement.belongsTo(models.User, {
        foreignKey: 'creator_id',
        as: 'creator',
      });
      ClientAgreement.belongsTo(models.User, {
        foreignKey: 'reviewer_id',
        as: 'reviewer',
      });
    }
  }
  ClientAgreement.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      contract_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      permanence_fine: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
      },
      end_of_permanence: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      number_of_payments: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      payment_value: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
      },
      status: {
        allowNull: false,
        type: DataTypes.ENUM('pending', 'checked'),
        defaultValue: 'pending',
      },
      doc_id: { allowNull: false, type: DataTypes.BIGINT.UNSIGNED },
      creator_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      reviewer_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'client_agreements',
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
  return ClientAgreement;
};
