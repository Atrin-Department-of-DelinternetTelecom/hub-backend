'use strict';
const { Model } = require('sequelize');
const config = require('@config');
module.exports = (sequelize, DataTypes) => {
  class CallMeTaggable extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of DataTypes lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      CallMeTaggable.belongsTo(models.CallMeTag, {
        foreignKey: 'tag_id',
        as: 'tag',
      });
      CallMeTaggable.belongsTo(models.CallMe, {
        foreignKey: 'callme_id',
        as: 'callMe',
      });
    }
  }

  CallMeTaggable.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      callme_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      tag_id: {
        allowNull: false,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      comment: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: 'CallMeTaggable',
      tableName: 'web_call_me_taggables',
      timestamps: false,
      paranoid: false,
      schema: config.get('index.sequelize.system.database'),
    },
  );

  return CallMeTaggable;
};
