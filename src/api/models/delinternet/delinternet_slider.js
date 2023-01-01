//@ts-check
'use strict';

const _ = require('lodash');
const config = require('@config');
const { Mixin } = require('@lib/media');
const { Model } = require('sequelize');
const path = require('path');
const SliderFields = require('@api/resources/web/fields/Slider');

module.exports = (sequelize, DataTypes) => {
  class DelinternetSlider extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DelinternetSlider.hasMany(models.GlobalMedia, {
        as: 'media',
        foreignKey: 'model_id',
        scope: {
          model_type: DelinternetSlider.name,
        },
      });
    }
  }
  DelinternetSlider.init(
    new SliderFields().fieldCollection().toSequelizeConfig(),
    {
      sequelize,
      modelName: 'DelinternetSlider',
      paranoid: true,
      schema: config.get('index.sequelize.system.database'),
      underscored: true,
      hooks: {
        async beforeDestroy(instance, options) {
          if (!instance.isSoftDeleted()) {
            // @ts-ignore
            const media = await instance.getMedia();

            await Promise.all(media.map((media) => media.destroy(options)));
          }
        },
      },
    },
  );

  /**
   * Get value from detail by key.
   *
   * @param {string} key
   * @param {any} callback
   * @return {any}
   */
  DelinternetSlider.prototype.getDetail = function (key, callback = null) {
    return _.get(this.get('detail'), key, callback);
  };

  /**
   * Set value into detail by key.
   *
   * @param {string} key
   * @param {any} value
   * @return {any}
   */
  DelinternetSlider.prototype.setDetail = function (key, value = null) {
    this.set('detail', {
      ...Object(this.get('detail')),
      [key]: value,
    });

    return this;
  };
  // handle media library
  Mixin.applyTo(DelinternetSlider);

  // @ts-ignore
  DelinternetSlider.addCollection('desktop', function (collection) {
    collection.multiple();
    collection.useDisk('upload');
    collection.setPathGenerator((media, model) => {
      return path.join('sliders', `${model.get('id')}`, 'desktop');
    });
    collection.addConversion('main', (conversion) => {
      conversion
        .width(config.get('website.slider.desktop.width', 720))
        .height(config.get('website.slider.desktop.height', 576))
        .quality(90)
        .format('webp');
    });
    collection.addConversion('blur', (conversion) => {
      conversion
        .width(config.get('website.slider.desktop.width', 720))
        .height(config.get('website.slider.desktop.height', 576))
        .quality(90)
        .blur(10)
        .format('webp');
    });
    collection.addConversion('campaign', (conversion) => {
      conversion
        .width(config.get('website.campaign.desktop.width', 270))
        .height(config.get('website.campaign.desktop.height', 210))
        .quality(90)
        .format('webp');
    });
  });

  // @ts-ignore
  DelinternetSlider.addCollection('mobile', function (collection) {
    collection.multiple();
    collection.useDisk('upload');
    collection.setPathGenerator((media, model) => {
      return path.join('sliders', `${model.get('id')}`, 'mobile');
    });
    collection.addConversion('main', (conversion) => {
      conversion
        .width(config.get('website.slider.mobile.width', 320))
        .height(config.get('website.slider.mobile.height', 280))
        .quality(90)
        .format('webp');
    });
    collection.addConversion('blur', (conversion) => {
      conversion
        .width(config.get('website.slider.mobile.width', 320))
        .height(config.get('website.slider.mobile.height', 280))
        .quality(90)
        .blur(10)
        .format('webp');
    });
    collection.addConversion('campaign', (conversion) => {
      conversion
        .width(config.get('website.campaign.mobile.width', 345))
        .height(config.get('website.campaign.mobile.height', 250))
        .quality(90)
        .format('webp');
    });
  });
  return DelinternetSlider;
};
