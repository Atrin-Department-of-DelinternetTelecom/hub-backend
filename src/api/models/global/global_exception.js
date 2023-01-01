//@ts-check
'use strict';

const ExceptionFields = require('@resources/global/fields/Exception');
const config = require('@config');
const { Model } = require('sequelize');

module.exports = function (sequelize, DataTypes) {
  class GlobalException extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    // @ts-ignore
    static associate(models) {
      GlobalException.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
    }
  }

  GlobalException.init(
    new ExceptionFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'GlobalException',
      paranoid: false,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
    },
  );

  return GlobalException;
};
