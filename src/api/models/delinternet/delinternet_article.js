//@ts-check
'use strict';
const config = require('@config');
const hooks = require('./hooks');
const { Mixin } = require('@lib/media');
const { Model } = require('sequelize');
const { Op } = require('sequelize');
const ArticleFields = require('@api/resources/web/fields/Article');
const path = require('path');

module.exports = (sequelize, DataTypes) => {
  class DelinternetArticle extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DelinternetArticle.belongsToMany(models.DelinternetCategory, {
        through: models.DelinternetArticleCategory,
        foreignKey: 'delinternet_article_id',
        otherKey: 'delinternet_category_id',
        as: 'categories',
      });
      DelinternetArticle.belongsToMany(models.DelinternetTag, {
        through: models.DelinternetArticleTag,
        foreignKey: 'delinternet_article_id',
        otherKey: 'delinternet_tag_id',
        as: 'tags',
      });
      DelinternetArticle.hasMany(models.DelinternetArticle, {
        foreignKey: 'group',
        sourceKey: 'group',
        as: 'translations',
        scope: {
          id: {
            [Op.not]: sequelize.col(`DelinternetArticle.id`),
          },
        },
      });
      DelinternetArticle.hasMany(models.GlobalMedia, {
        as: 'media',
        foreignKey: 'model_id',
        scope: {
          model_type: DelinternetArticle.name,
        },
      });
    }
  }
  DelinternetArticle.init(
    new ArticleFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'DelinternetArticle',
      paranoid: true,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
      hooks,
    },
  );

  /**
   * Get delinternet url.
   *
   * @return {String}
   */
  DelinternetArticle.prototype.getUrl = function () {
    const articles = config.get(
      `delinternet.urls.articles.${this.get('locale')}`,
    );

    return `${articles}/${this.get('slug')}`;
  };

  // handle media library
  Mixin.applyTo(DelinternetArticle);

  // @ts-ignore
  DelinternetArticle.addCollection('desktop', function (collection) {
    collection.useDisk('upload');
    collection.setPathGenerator((media, model) => {
      return path.join('articles', `${model.get('id')}`, 'desktop');
    });
    collection.addConversion('large', (conversion) => {
      conversion
        .width(config.get('website.article.large.width', 886))
        .height(config.get('website.article.large.height', 386))
        .quality(90)
        .format('webp');
    });
    collection.addConversion('thumbnail', (conversion) => {
      conversion
        .width(config.get('website.article.thumbnail.width', 274))
        .height(config.get('website.article.thumbnail.height', 130))
        .quality(90)
        .format('webp');
    });
  });

  // @ts-ignore
  DelinternetArticle.addCollection('mobile', function (collection) {
    collection.useDisk('upload');
    collection.setPathGenerator((media, model) => {
      return path.join('articles', `${model.get('id')}`, 'mobile');
    });
    collection.addConversion('mobile', (conversion) => {
      conversion
        .width(config.get('website.article.mobile.width', 320))
        .height(config.get('website.article.mobile.height', 280))
        .quality(90)
        .format('webp');
    });
  });

  // @ts-ignore
  DelinternetArticle.addCollection('editor', (collection) => {
    collection.useDisk('upload');
  });
  return DelinternetArticle;
};
