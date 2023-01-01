//@ts-check
'use strict';
const config = require('@config');
const { Model } = require('sequelize');
const SellerCompetitionPointFields = require('@resources/global/fields/SellerCompetitionPoint');

module.exports = (sequelize, DataTypes) => {
  class SellerCompetitionPoint extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {}
  }

  SellerCompetitionPoint.init(
    new SellerCompetitionPointFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'SellerCompetitionPoint',
      paranoid: false,
      timestamps: false,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
    },
  );

  return SellerCompetitionPoint;
};
