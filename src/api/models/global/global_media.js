'use strict';
const _ = require('lodash');
const { get: config } = require('@config');
const { Model } = require('sequelize');
const MediaFields = require('@resources/global/fields/Media');
const path = require('path');
const sharp = require('sharp');
const {
  uploadFile,
  downloadFile,
  deleteFile,
} = require('@api/service/file/fileService');
const mime = require('mime-types');
const { default: to } = require('await-to-js');

module.exports = (sequelize, DataTypes) => {
  class GlobalMedia extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */

    static associate(models) {}

    static get bucket() {
      return 'GlobalMedia';
    }

    static get conversionBucket() {
      return 'GlobalMedia/Conversion';
    }

    /**
     * Store new file
     *
     * @param {Object} file
     * @returns void
     */
    async store(file) {
      const { filename } = await uploadFile(GlobalMedia.bucket, file);
      const { name, ext } = path.parse(filename);

      await this.update({ extension: ext.substring(1), name, filename });
    }

    /**
     * Update file metadata after update.
     *
     * @returns {Promise<void>}
     */
    async updateForResource(model, metadata = {}, transaction) {
      // @ts-ignore
      await this.update(
        {
          model_type: model.constructor.name,
          model_id: model.id,
          metadata: {
            ...this.metadata,
            ...metadata,
            conversions: model.constructor
              .getCollection(this.collection)
              .conversions()
              .map((conversion) => conversion.jsonSerialize()),
          },
        },
        { transaction },
      );

      await this.generateConversions();
    }

    /**
     * Get url of the uploaded file.
     *
     * @param {String} conversion
     * @returns {String}
     */
    getUrl(conversion = null) {
      const url = config('index.app.url', '');

      return `${url}${this.getUri(conversion)}`;
    }

    /**
     * Get uri of the uploaded file.
     *
     * @param {String} conversion
     * @returns {String}
     */
    getUri(conversion = null) {
      const base = conversion
        ? '/conversions'
        : config(`storage.disks.${this.disk}.public_url`);

      return `${base}/${this.getFilePath(conversion).replace(
        /\\+/g,
        '/',
      )}`.replace(/\/+/g, '/');
    }

    /**
     * Get path of the uploaded file.
     *
     * @param {String} conversion
     * @returns {String}
     */
    getFilePath(conversion = null) {
      // @ts-ignore
      return conversion
        ? this.getConversionPath(conversion)
        : path.join(this.getMetadata('path', '') || '', this.filename || '');
    }

    /**
     * Get value from metadata by key.
     *
     * @param {string} key
     * @param {any} callback
     * @return {any}
     */
    getMetadata(key, callback = null) {
      return _.get(this.get('metadata'), key, callback);
    }

    /**
     * Set value into metadata by key.
     *
     * @param {string} key
     * @param {any} value
     * @return {any}
     */
    setMetadata(key, value = null) {
      this.set('metadata', {
        ...Object(this.get('metadata')),
        [key]: value,
      });

      return this;
    }

    /**
     * Generate image conversions.
     *
     * @returns {Promise<void>}
     */
    async generateConversions() {
      const [error, file] = await to(
        downloadFile(this.filename, GlobalMedia.bucket),
      );
      if (error) {
        console.warn(error);

        return;
      }
      const original = await sharp(file.data);
      const metadata = await original.metadata();

      const conversions = await Promise.all(
        this.getMetadata('conversions', []).map(async (conversion) => {
          const buffer = await original
            .resize({
              width: conversion.width ?? metadata.width,
              height: conversion.height ?? metadata.height,
              fit: sharp.fit.outside,
            })
            .toFormat(conversion.format ?? metadata.format, {
              quality: conversion.quality,
            })
            .blur(conversion.blur ?? false)
            .toBuffer();

          const { filename } = await uploadFile(GlobalMedia.conversionBucket, {
            data: buffer,
            mimetype: mime.lookup(conversion.format ?? metadata.format),
          });

          return { ...conversion, filename, path: '' };
        }),
      );

      await this.update({
        metadata: { ...this.metadata, conversions },
      });
    }

    /**
     * Get path of the uploaded file.
     *
     * @param {String} name
     * @returns {String}
     */
    getConversionPath(name) {
      const conversion = this.getMetadata('conversions', []).find(
        (conversion) => {
          return conversion.name === name;
        },
      );

      return conversion && conversion.filename
        ? path.join(conversion.path || '', conversion.filename || '')
        : this.getFilePath();
    }
  }

  GlobalMedia.init(new MediaFields().fieldCollection().toSequelizeConfig(), {
    sequelize,
    modelName: 'GlobalMedia',
    paranoid: false,
    underscored: true,
    hooks: {
      async beforeDestroy(media) {
        // clean main file
        await deleteFile(media.filename, GlobalMedia.bucket);
        // clean conversions images
        await Promise.allSettled(
          media.getMetadata('conversions', []).map(({ filename }) => {
            return deleteFile(filename, GlobalMedia.conversionBucket);
          }),
        );
      },
    },
  });

  return GlobalMedia;
};
