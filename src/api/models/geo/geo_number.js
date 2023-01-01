'use strict';
const { Model } = require('sequelize');
const config = require('@config');

module.exports = (sequelize, DataTypes) => {
  class GeoNumber extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of DataTypes lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      GeoNumber.belongsTo(models.GeoStreet, {
        foreignKey: 'street_id',
      });
    }

    async upgrade(any) {
      await this.update(any);
    }
  }

  GeoNumber.init(
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
      gml_id: {
        allowNull: true,
        type: DataTypes.STRING,
        unique: false,
      },
      rc: {
        allowNull: true,
        type: DataTypes.STRING,
        unique: false,
      },
      gml_srs: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      gml_pos_x: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      gml_pos_y: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      gml_lat: {
        allowNull: true,
        type: DataTypes.DOUBLE,
      },
      gml_lng: {
        allowNull: true,
        type: DataTypes.DOUBLE,
      },
      postal_code: {
        allowNull: true,
        type: DataTypes.STRING,
        unique: false,
      },
      number: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      alias: {
        allowNull: true,
        type: DataTypes.STRING,
      },
      rc_meta: {
        allowNull: true,
        type: DataTypes.TEXT,
      },
      rc_meta_updated_at: {
        allowNull: true,
        type: DataTypes.DATE,
      },
      street_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
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
      modelName: 'GeoNumber',
      tableName: 'geo_numbers',
      underscored: true,
      timestamps: true,
      schema: config.get('index.sequelize.system.database'),
    },
  );

  GeoNumber.searchCityId = (value) => {
    return {
      key: '$GeoStreet.GeoCity.id$',
      where: value,
    };
  };

  GeoNumber.searchProvinceId = (value) => {
    return {
      key: '$GeoStreet.GeoCity.GeoProvince.id$',
      where: value,
    };
  };

  GeoNumber.searchStreetId = (value) => {
    return {
      key: 'street_id',
      where: value,
    };
  };

  return GeoNumber;
};
