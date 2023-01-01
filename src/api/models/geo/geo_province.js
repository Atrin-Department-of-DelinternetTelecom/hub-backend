'use strict';
const { Model } = require('sequelize');
const config = require('@config');

module.exports = (sequelize, DataTypes) => {
  class GeoProvince extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of DataTypes lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      GeoProvince.belongsTo(models.GeoCountry, {
        foreignKey: 'country_id',
      });

      GeoProvince.hasMany(models.GeoCity, {
        foreignKey: 'province_id',
      });
    }

    async upgrade(any) {
      await this.update(any);
    }
  }

  GeoProvince.init(
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
      formated_name: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      alias: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      country_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      import_cities: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cities_imported_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      auto_update: {
        type: DataTypes.TINYINT,
        defaultValue: 0,
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
      modelName: 'GeoProvince',
      tableName: 'geo_provinces',
      underscored: true,
      timestamps: true,
      schema: config.get('index.sequelize.system.database'),
    },
  );
  return GeoProvince;
};
