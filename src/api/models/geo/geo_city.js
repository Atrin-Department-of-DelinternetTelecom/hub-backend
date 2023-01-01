'use strict';
const { Model } = require('sequelize');
const config = require('@config');

module.exports = (sequelize, DataTypes) => {
  class GeoCity extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of DataTypes lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      GeoCity.belongsTo(models.GeoProvince, {
        foreignKey: 'province_id',
      });

      GeoCity.hasMany(models.GeoStreet, {
        foreignKey: 'city_id',
      });
    }

    async upgrade(any) {
      await this.update(any);
    }
  }

  GeoCity.init(
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
      idescat_code: {
        allowNull: true,
        type: DataTypes.INTEGER,
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
      mhap_province_code: {
        allowNull: true,
        type: DataTypes.INTEGER,
        unique: false,
      },
      ine_province_code: {
        allowNull: true,
        type: DataTypes.INTEGER,
        unique: false,
      },
      province_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      import_streets: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      streets_imported_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      import_numbers: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      numbers_imported_at: {
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
      modelName: 'GeoCity',
      tableName: 'geo_cities',
      underscored: true,
      timestamps: true,
      schema: config.get('index.sequelize.system.database'),
    },
  );
  return GeoCity;
};
