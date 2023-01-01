'use strict';
const { Model } = require('sequelize');
const config = require('@config');

module.exports = (sequelize, DataTypes) => {
  class GeoCountry extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of DataTypes lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      GeoCountry.hasMany(models.GeoProvince, {
        foreignKey: 'country_id',
      });
    }
  }

  GeoCountry.init(
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER.UNSIGNED,
      },
      manual: {
        allowNull: false,
        type: DataTypes.TINYINT(1),
        defaultValue: 0,
      },
      code: {
        allowNull: false,
        type: DataTypes.STRING,
        unique: true,
      },
      mhap_code: {
        allowNull: false,
        type: DataTypes.INTEGER,
        unique: false,
      },
      ine_code: {
        allowNull: false,
        type: DataTypes.INTEGER,
        unique: false,
      },
      name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      alias: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: true,
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: 'GeoCountry',
      tableName: 'geo_countries',
      underscored: true,
      timestamps: true,
      schema: config.get('index.sequelize.system.database'),
    },
  );
  return GeoCountry;
};
