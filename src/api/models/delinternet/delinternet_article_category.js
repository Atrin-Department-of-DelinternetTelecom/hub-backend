//@ts-check
'use strict';

const ArticleCategoryFields = require('@api/resources/web/fields/ArticleCategory');
const config = require('@config');
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class DelinternetArticleCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DelinternetArticleCategory.belongsTo(models.DelinternetCategory);
      DelinternetArticleCategory.belongsTo(models.DelinternetArticle);
    }
  }
  DelinternetArticleCategory.init(
    new ArticleCategoryFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'DelinternetArticleCategory',
      tableName: 'delinternet_article_category',
      timestamps: false,
      schema: config.get('index.sequelize.system.database'),
      paranoid: false,
      underscored: true,
    },
  );
  return DelinternetArticleCategory;
};
