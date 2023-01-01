//@ts-check
'use strict';
const config = require('@config');
const { Model } = require('sequelize');
const Comment = require('@api/resources/web/fields/Comment');

module.exports = (sequelize, DataTypes) => {
  class DelinternetComment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DelinternetComment.belongsTo(DelinternetComment, {
        foreignKey: 'comment_id',
        as: 'comment',
      });
      DelinternetComment.hasMany(DelinternetComment, {
        foreignKey: 'comment_id',
        as: 'comments',
      });
      DelinternetComment.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });
    }
  }

  DelinternetComment.init(new Comment().fieldCollection().toSequelizeConfig(), {
    sequelize,
    modelName: 'DelinternetComment',
    paranoid: true,
    schema: config.get('index.sequelize.system.database'),
    underscored: true,
  });

  return DelinternetComment;
};
