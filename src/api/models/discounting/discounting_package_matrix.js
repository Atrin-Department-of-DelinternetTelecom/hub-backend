//@ts-check
'use strict';
const config = require('@config');
const { Model } = require('sequelize');
const DiscountingPackageMatrixFields = require('@resources/discounting/fields/DiscountingPackageMatrix');

module.exports = (sequelize, DataTypes) => {
  class DiscountingPackageMatrix extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DiscountingPackageMatrix.belongsTo(models.DiscountingPackage);
      DiscountingPackageMatrix.belongsTo(models.GfDiscountsMatrix);
    }
  }

  DiscountingPackageMatrix.init(
    new DiscountingPackageMatrixFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'DiscountingPackageMatrix',
      tableName: 'discounting_package_matrix',
      paranoid: false,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
      timestamps: false,
    },
  );

  return DiscountingPackageMatrix;
};
