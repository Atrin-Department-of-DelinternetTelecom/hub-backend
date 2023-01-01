//@ts-check
'use strict';
const config = require('@config');
const { Model } = require('sequelize');
const SuspendingReasonFields = require('@resources/global/fields/SuspendingReason');

module.exports = (sequelize, DataTypes) => {
  class SuspendingReason extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      SuspendingReason.belongsToMany(models.SuspendingAction, {
        through: models.SuspendingActionReason,
      });
    }
  }

  SuspendingReason.init(
    new SuspendingReasonFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'SuspendingReason',
      paranoid: false,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
    },
  );

  return SuspendingReason;
};
