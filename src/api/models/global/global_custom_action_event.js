//@ts-check
'use strict';

const CustomActionEventFields = require('@api/resources/global/fields/CustomActionEvent');
const config = require('@config');
const { Model, DataTypes } = require('sequelize');
const uuid = require('uuid');

module.exports = function (sequelize) {
  class CustomActionEvent extends Model {
    static associate(models) {
      CustomActionEvent.belongsTo(models.CustomActionEventType, {
        foreignKey: 'typeId',
        as: 'actionType',
      });

      CustomActionEvent.belongsTo(models.ActionEvent, {
        foreignKey: 'eventId',
        as: 'actionEvent',
      });
      CustomActionEvent.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
      });
      CustomActionEvent.belongsTo(models.GfClient, {
        foreignKey: 'clientId',
        as: 'client',
      });
    }
  }

  CustomActionEvent.init(
    new CustomActionEventFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'CustomActionEvent',
      tableName: 'global_custom_action_events',
      paranoid: false,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
    },
  );

  return CustomActionEvent;
};
