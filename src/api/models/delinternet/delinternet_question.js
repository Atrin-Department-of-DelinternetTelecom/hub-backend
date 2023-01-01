//@ts-check
'use strict';

const { Model } = require('sequelize');
const config = require('@config');
const QuestionFields = require('@api/resources/web/fields/Question');

module.exports = (sequelize, DataTypes) => {
  class DelinternetQuestion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DelinternetQuestion.init(
    new QuestionFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'DelinternetQuestion',
      paranoid: true,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
    },
  );
  return DelinternetQuestion;
};
