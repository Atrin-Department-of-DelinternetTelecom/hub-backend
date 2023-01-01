'use strict';
const { Model, Op } = require('sequelize');
const config = require('@config');
const moment = require('moment');

module.exports = (sequelize, DataTypes) => {
  class CallMeVisitor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CallMeVisitor.belongsTo(models.User, {
        foreignKey: 'visitor_id',
        as: 'visitor',
      });
      CallMeVisitor.belongsTo(models.CallMe, {
        foreignKey: 'callme_id',
        as: 'callMe',
      });
    }
  }

  CallMeVisitor.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      visitor_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      callme_id: {
        allowNull: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      created_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updated_at: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'CallMeVisitor',
      tableName: 'web_call_me_visitors',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      schema: config.get('index.sequelize.system.database'),
      paranoid: false,
    },
  );

  return CallMeVisitor;
};
