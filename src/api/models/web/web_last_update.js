'use strict';
const { Model } = require('sequelize');
const config = require('@config');

module.exports = (sequelize, DataTypes) => {
  class LastUpdate extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {}
  }

  LastUpdate.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT.UNSIGNED,
      },
      metadata: {
        allowNull: true,
        type: DataTypes.TEXT,
        get: function () {
          return JSON.parse(this.getDataValue('metadata') || '{}');
        },
        set: function (value) {
          this.setDataValue('metadata', JSON.stringify(value));
        },
      },
      deletedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'LastUpdate',
      tableName: 'web_caches',
      underscored: true,
      timestamps: true,
      schema: config.get('index.sequelize.system.database'),
      paranoid: true,
    },
  );
  return LastUpdate;
};
