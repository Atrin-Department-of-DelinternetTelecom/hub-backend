'use strict';
const { Model } = require('sequelize');
const config = require('@config');
module.exports = (sequelize, DataTypes) => {
  class CallMeTag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of DataTypes lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {}
  }

  CallMeTag.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      description: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      comment_required: {
        allowNull: false,
        type: DataTypes.BOOLEAN,
        default: false,
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
      modelName: 'CallMeTag',
      tableName: 'web_call_me_tags',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      schema: config.get('index.sequelize.system.database'),
      paranoid: false,
    },
  );

  return CallMeTag;
};
