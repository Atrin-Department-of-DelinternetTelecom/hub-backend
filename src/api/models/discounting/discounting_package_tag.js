//@ts-check
'use strict';
const config = require('@config');
const { Model } = require('sequelize');
const DiscountingPackageTagFields = require('@resources/discounting/fields/DiscountingPackageTag');

module.exports = (sequelize, DataTypes) => {
  class DiscountingPackageTag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DiscountingPackageTag.belongsTo(models.DiscountingPackage);
      DiscountingPackageTag.belongsTo(models.InvoiceClientsExtraField);
    }
  }

  DiscountingPackageTag.init(
    new DiscountingPackageTagFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'DiscountingPackageTag',
      tableName: 'discounting_package_client_tag',
      paranoid: false,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
      timestamps: false,
    },
  );

  return DiscountingPackageTag;
};
