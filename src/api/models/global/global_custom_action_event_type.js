//@ts-check
'use strict';

const { Model, DataTypes } = require('sequelize');
const config = require('@config');
const uuid = require('uuid');
const CustomActionEventTypeFields = require('@api/resources/global/fields/CustomActionEventType');

module.exports = function (sequelize) {
  class CustomActionEventType extends Model {}

  CustomActionEventType.init(
    new CustomActionEventTypeFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'CustomActionEventType',
      tableName: 'global_custom_action_event_types',
      paranoid: false,
      underscored: true,
      schema: config.get('index.sequelize.system.database'),
    },
  );
  return CustomActionEventType;
};
