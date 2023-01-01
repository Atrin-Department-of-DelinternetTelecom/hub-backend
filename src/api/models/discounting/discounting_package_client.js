//@ts-check
'use strict';
const config = require('@config');
const { Model } = require('sequelize');
const DiscountingPackageClientFields = require('@resources/discounting/fields/DiscountingPackageClient');

module.exports = (sequelize, DataTypes) => {
  class DiscountingPackageClient extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DiscountingPackageClient.belongsTo(models.DiscountingPackage);
      DiscountingPackageClient.belongsTo(models.GfClient);
    }
  }

  DiscountingPackageClient.init(
    new DiscountingPackageClientFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'DiscountingPackageClient',
      tableName: 'discounting_package_client',
      paranoid: false,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
      timestamps: false,
    },
  );

  return DiscountingPackageClient;
};
