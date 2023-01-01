'use strict';

const config = require('@config');

module.exports = function (sequelize, DataTypes) {
  const LeaveRequest = sequelize.define(
    'LeaveRequest',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      creator_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      doc_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        default: null,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      vacations: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
        default: null,
      },
      status: {
        type: DataTypes.ENUM(
          'pending-request',
          'approved-request',
          'on-vacation',
          'canceled-request',
          'vacation-ended',
          'finished',
        ),
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
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
      tableName: 'hrms_leave_requests',
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

  LeaveRequest.associate = function (models) {
    LeaveRequest.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
    LeaveRequest.belongsTo(models.Document, {
      foreignKey: 'doc_id',
      as: 'document',
    });
    LeaveRequest.belongsTo(models.User, {
      foreignKey: 'creator_id',
      as: 'creator',
    });
  };

  return LeaveRequest;
};
