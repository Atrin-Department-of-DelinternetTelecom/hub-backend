//@ts-check
'use strict';
const config = require('@config');
const { Model } = require('sequelize');
const DiscountingPackageFeeFields = require('@resources/discounting/fields/DiscountingPackageFee');

module.exports = (sequelize, DataTypes) => {
  class DiscountingPackageFee extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DiscountingPackageFee.belongsTo(models.DiscountingPackage);
      DiscountingPackageFee.belongsTo(models.GfFeeGroup);
    }
  }

  DiscountingPackageFee.init(
    new DiscountingPackageFeeFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'DiscountingPackageFee',
      tableName: 'discounting_package_fee',
      paranoid: false,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
      timestamps: false,
    },
  );

  return DiscountingPackageFee;
};
