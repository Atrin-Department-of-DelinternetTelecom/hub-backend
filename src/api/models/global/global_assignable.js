//@ts-check
'use strict';
const config = require('@config');
const { Model } = require('sequelize');
const AssignableFields = require('@resources/global/fields/Assignable');

module.exports = (sequelize, DataTypes) => {
  class Assignable extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Assignable.belongsTo(models.User, {
        foreignKey: 'creator_id',
        targetKey: 'userId',
      });
      Assignable.hasMany(models.AssignableHistory);
    }
  }

  Assignable.init(
    new AssignableFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'Assignable',
      paranoid: true,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
    },
  );

  return Assignable;
};
