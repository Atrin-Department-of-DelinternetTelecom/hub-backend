//@ts-check
'use strict';
const SuspendingActionReasonFields = require('@api/resources/global/fields/SuspendingActionReason');
const config = require('@config');
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SuspendingActionReason extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      SuspendingActionReason.belongsTo(models.SuspendingAction);
      SuspendingActionReason.belongsTo(models.SuspendingReason);
    }
  }

  SuspendingActionReason.init(
    new SuspendingActionReasonFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'SuspendingActionReason',
      tableName: 'suspending_action_reason',
      paranoid: false,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
      timestamps: false,
    },
  );

  return SuspendingActionReason;
};
