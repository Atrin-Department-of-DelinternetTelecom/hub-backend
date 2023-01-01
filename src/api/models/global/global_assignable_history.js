//@ts-check
'use strict';
const config = require('@config');
const { Model } = require('sequelize');
const AssignableHistoryFields = require('@resources/global/fields/AssignableHistory');

module.exports = (sequelize, DataTypes) => {
  class AssignableHistory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      AssignableHistory.belongsTo(models.User, {
        foreignKey: 'operator_id',
        targetKey: 'userId',
      });
      AssignableHistory.belongsTo(models.Assignable);
      AssignableHistory.belongsTo(models.GfContract, {
        foreignKey: 'contract_id',
      });
    }
  }

  AssignableHistory.init(
    new AssignableHistoryFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'AssignableHistory',
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
    },
  );

  return AssignableHistory;
};
