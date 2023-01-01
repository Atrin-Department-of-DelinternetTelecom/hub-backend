//@ts-check
'use strict';

const _ = require('lodash');
const HotlinkFields = require('@api/resources/web/fields/Hotlink');
const { Model } = require('sequelize');
const config = require('@config');

module.exports = (sequelize, DataTypes) => {
  class DelinternetHotlink extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DelinternetHotlink.init(
    new HotlinkFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'DelinternetHotlink',
      paranoid: true,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
    },
  );

  /**
   * Get value from detail by key.
   *
   * @param {string} key
   * @param {any} callback
   * @return {any}
   */
  DelinternetHotlink.prototype.getDetail = function (key, callback = null) {
    return _.get(this.get('detail'), key, callback);
  };

  /**
   * Set value into detail by key.
   *
   * @param {string} key
   * @param {any} value
   * @return {any}
   */
  DelinternetHotlink.prototype.setDetail = function (key, value = null) {
    this.set('detail', {
      ...Object(this.get('detail')),
      [key]: value,
    });

    return this;
  };
  return DelinternetHotlink;
};
