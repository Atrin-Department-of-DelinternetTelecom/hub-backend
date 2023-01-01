//@ts-check
'use strict';

const ArticleTagFields = require('@api/resources/web/fields/ArticleTag');
const config = require('@config');
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DelinternetArticleTag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DelinternetArticleTag.belongsTo(models.DelinternetTag);
      DelinternetArticleTag.belongsTo(models.DelinternetArticle);
    }
  }
  DelinternetArticleTag.init(
    new ArticleTagFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'DelinternetArticleTag',
      tableName: 'delinternet_article_tag',
      timestamps: false,
      schema: config.get('index.sequelize.system.database'),
      paranoid: false,
      underscored: true,
    },
  );
  return DelinternetArticleTag;
};
