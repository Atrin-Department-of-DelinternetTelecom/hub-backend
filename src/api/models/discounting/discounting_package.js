//@ts-check
'use strict';
const config = require('@config');
const { Model } = require('sequelize');
const DiscountingPackageFields = require('@resources/discounting/fields/DiscountingPackage');

module.exports = (sequelize, DataTypes) => {
  class DiscountingPackage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DiscountingPackage.belongsTo(models.GfFeegroupsGroupLabel, {
        foreignKey: 'label_group_id',
      });
      DiscountingPackage.belongsTo(models.GfFeegroupsLabel, {
        foreignKey: 'label_id',
      });
      DiscountingPackage.belongsTo(models.User, {
        foreignKey: 'creator_id',
        targetKey: 'userId',
      });
      DiscountingPackage.belongsToMany(models.GfFeeGroup, {
        through: models.DiscountingPackageFee,
      });
      DiscountingPackage.hasMany(models.DiscountingPackageFee);
      DiscountingPackage.belongsToMany(models.GfClient, {
        through: models.DiscountingPackageClient,
      });
      DiscountingPackage.belongsToMany(models.InvoiceClientsExtraField, {
        through: models.DiscountingPackageTag,
      });
      DiscountingPackage.belongsToMany(models.GfDiscountsMatrix, {
        through: models.DiscountingPackageMatrix,
      });
    }
  }

  DiscountingPackage.init(
    new DiscountingPackageFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'DiscountingPackage',
      paranoid: false,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
    },
  );

  return DiscountingPackage;
};
