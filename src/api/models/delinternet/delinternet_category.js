//@ts-check
'use strict';
const CategoryFields = require('@api/resources/web/fields/Category');
const config = require('@config');
const hooks = require('./hooks');
const { Mixin } = require('@lib/media');
const { Model } = require('sequelize');
const { Op } = require('sequelize');
const path = require('path');

module.exports = (sequelize, DataTypes) => {
  class DelinternetCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DelinternetCategory.belongsTo(models.DelinternetCategory, {
        as: 'category',
      });
      DelinternetCategory.belongsToMany(models.DelinternetArticle, {
        through: models.DelinternetArticleCategory,
      });
      DelinternetCategory.hasMany(models.DelinternetCategory, {
        foreignKey: 'group',
        sourceKey: 'group',
        as: 'translations',
        scope: {
          id: {
            [Op.not]: sequelize.col(`DelinternetCategory.id`),
          },
        },
      });
      DelinternetCategory.hasMany(models.DelinternetCategory, {
        foreignKey: 'group',
        sourceKey: 'group',
        as: 'allTranslations',
      });
      DelinternetCategory.hasMany(models.GlobalMedia, {
        as: 'media',
        foreignKey: 'model_id',
        scope: {
          model_type: DelinternetCategory.name,
        },
      });
    }
  }
  DelinternetCategory.init(
    new CategoryFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'DelinternetCategory',
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
  DelinternetCategory.prototype.getUrl = function () {
    const categories = config.get(
      `delinternet.urls.categories.${this.get('locale')}`,
    );

    return `${categories}/${this.get('slug')}`;
  };

  // handle media library
  Mixin.applyTo(DelinternetCategory);

  // @ts-ignore
  DelinternetCategory.addCollection('desktop', function (collection) {
    collection.useDisk('upload');
    collection.setPathGenerator((media, model) => {
      return path.join('categories', `${model.get('id')}`, 'desktop');
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
  DelinternetCategory.addCollection('mobile', function (collection) {
    collection.useDisk('upload');
    collection.setPathGenerator((media, model) => {
      return path.join('categories', `${model.get('id')}`, 'mobile');
    });
  });

  return DelinternetCategory;
};
