//@ts-check
'use strict';
const config = require('@config');
const hooks = require('./hooks');
const { Model } = require('sequelize');
const { Op } = require('sequelize');
const Tag = require('@api/resources/web/fields/Tag');

module.exports = (sequelize, DataTypes) => {
  class DelinternetTag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DelinternetTag.belongsToMany(models.DelinternetArticle, {
        through: models.DelinternetArticleTag,
      });
      DelinternetTag.hasMany(models.DelinternetTag, {
        foreignKey: 'group',
        sourceKey: 'group',
        as: 'translations',
        scope: {
          id: {
            [Op.not]: sequelize.col(`DelinternetTag.id`),
          },
        },
      });
      DelinternetTag.hasMany(models.DelinternetTag, {
        foreignKey: 'group',
        sourceKey: 'group',
        as: 'allTranslations',
      });
    }
  }

  DelinternetTag.init(new Tag().fieldCollection().toSequelizeConfig(), {
    sequelize,
    modelName: 'DelinternetTag',
    paranoid: true,
    schema: config.get('index.sequelize.system.database'),
    underscored: true,
    hooks,
  });

  /**
   * Get delinternet url.
   *
   * @return {String}
   */
  DelinternetTag.prototype.getUrl = function () {
    const tags = config.get(`delinternet.urls.tags.${this.get('locale')}`);

    return `${tags}/${this.get('slug')}`;
  };

  return DelinternetTag;
};
