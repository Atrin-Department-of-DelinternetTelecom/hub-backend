'use strict';
const { Model } = require('sequelize');
const config = require('@config');
const { streetTypeList } = require('@service/geo/lib/cadastreParser');

module.exports = (sequelize, DataTypes) => {
  class GeoStreet extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of DataTypes lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      GeoStreet.belongsTo(models.GeoCity, {
        foreignKey: 'city_id',
      });

      GeoStreet.hasMany(models.GeoNumber, {
        foreignKey: 'street_id',
      });
    }
    async upgrade(any) {
      await this.update(any);
    }
  }

  GeoStreet.init(
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
      dgc_code: {
        allowNull: true,
        type: DataTypes.INTEGER,
        unique: false,
      },
      type: {
        allowNull: true,
        type: DataTypes.STRING,
        unique: false,
      },
      catalanType: {
        allowNull: true,
        type: DataTypes.VIRTUAL,
        get() {
          const languages = streetTypeList[this.type];
          if (languages) return languages[2];
        },
      },
      formated_type: {
        allowNull: true,
        type: DataTypes.STRING,
        unique: false,
      },
      name: {
        allowNull: true,
        type: DataTypes.STRING,
        unique: false,
      },
      formated_name: {
        allowNull: true,
        type: DataTypes.STRING,
        unique: false,
      },
      alias: {
        allowNull: true,
        type: DataTypes.STRING,
        unique: false,
      },
      mhap_city_code: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      ine_city_code: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      ine_province_code: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      import_numbers: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      numbers_imported_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      city_id: {
        allowNull: true,
        type: DataTypes.INTEGER.UNSIGNED,
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
      modelName: 'GeoStreet',
      tableName: 'geo_streets',
      underscored: true,
      timestamps: true,
      schema: config.get('index.sequelize.system.database'),
    },
  );

  GeoStreet.searchCatalanType = (value) => {
    const whereIn = [];
    const type = value?.replace(/%/g, '')?.toLowerCase();
    for (const key in streetTypeList) {
      const languages = streetTypeList[key];
      if (languages[2]?.toLowerCase().includes(type)) whereIn.push(key);
    }
    return {
      key: 'type',
      where: whereIn,
    };
  };

  return GeoStreet;
};
