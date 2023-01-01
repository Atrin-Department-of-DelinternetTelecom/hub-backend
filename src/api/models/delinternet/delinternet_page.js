'use strict';

//@ts-chekc
const config = require('@config');
const hooks = require('./hooks');
const { Mixin } = require('@lib/media');
const { Model } = require('sequelize');
const { Op } = require('sequelize');
const PageFields = require('@api/resources/web/fields/Page');
const path = require('path');

module.exports = (sequelize, DataTypes) => {
  class DelinternetPage extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DelinternetPage.hasMany(models.DelinternetPage, {
        foreignKey: 'group',
        sourceKey: 'group',
        as: 'translations',
        scope: {
          id: {
            [Op.not]: sequelize.col(`DelinternetPage.id`),
          },
        },
      });
      DelinternetPage.hasMany(models.GlobalMedia, {
        as: 'media',
        foreignKey: 'model_id',
        scope: {
          model_type: DelinternetPage.name,
        },
      });
    }
  }
  DelinternetPage.init(new PageFields().fieldCollection().toSequelizeConfig(), {
    sequelize,
    modelName: 'DelinternetPage',
    paranoid: true,
    schema: config.get('index.sequelize.system.database'),
    underscored: true,
    hooks,
  });

  /**
   * Get website url.
   *
   * @return {String}
   */
  DelinternetPage.prototype.getUrl = function () {
    return `${config.get('website.url', 'https://delinternet.com')}/${this.get(
      'locale',
    )}/${this.get('slug')}`;
  };

  // handle media library
  Mixin.applyTo(DelinternetPage);

  // @ts-ignore
  DelinternetPage.addCollection('desktop', function (collection) {
    collection.useDisk('upload');
    collection.setPathGenerator((media, model) => {
      return path.join('pages', `${model.get('id')}`, 'desktop');
    });
  });

  // @ts-ignore
  DelinternetPage.addCollection('mobile', function (collection) {
    collection.useDisk('upload');
    collection.setPathGenerator((media, model) => {
      return path.join('pages', `${model.get('id')}`, 'mobile');
    });
  });

  // @ts-ignore
  DelinternetPage.addCollection('editor', (collection) => {
    collection.useDisk('upload');
  });

  return DelinternetPage;
};
