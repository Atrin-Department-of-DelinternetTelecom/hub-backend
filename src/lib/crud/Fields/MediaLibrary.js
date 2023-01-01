'use strict';
const Field = require('./Array');
const helpers = require('@utils/helpers');
const models = require('@models');

module.exports = class MediaLibrary extends Field {
  /**
   * The media collection name.
   *
   * @type {String}
   */
  #collection;

  /**
   * Instantiate the field for the given parameters.
   *
   * @param  {string} name
   * @param  {string=} attribute
   * @constructor
   */
  constructor(name, attribute) {
    super(name, attribute);
    this.collection(this.attribute);
    this.swagger('items', {
      type: 'object',
      properties: {
        media: { type: 'number' },
        metadata: { type: 'object' },
      },
    });
    this.hideOnSequelize();
  }

  /**
   * Set the collection name.
   *
   * @param {String} collection
   * @returns {Object}
   */
  collection(collection) {
    this.#collection = collection;

    return this;
  }

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   *
   * @param  {object}  request
   * @param  {object}  model
   * @param  {string}  attribute
   * @return {any}
   */
  fillAttributeFromRequest(req, model, attribute) {
    // ignore when not filled
    if (!req.has(attribute)) return;

    helpers.throwUnless(
      model.constructor.hasCollection(this.#collection),
      `Collection '${this.#collection}' not found.`,
    );

    return async (req, model, transaction) => {
      const collection = model.constructor.getCollection(this.#collection);
      const media = this.getMediaFromRequest(req, model, attribute);

      // remove detached media
      const shouldRemove = await models.system.GlobalMedia.findAll({
        where: {
          model_id: model.id,
          model_type: model.constructor.name,
          collection: this.#collection,
        },
      });

      await Promise.all(
        shouldRemove
          .filter((model) => {
            // if was single file will accept only last item
            return collection.isMultiple()
              ? !media.find((item) => item.media === model.id)
              : model.id !== media[media.length - 1]?.media;
          })
          .map((item) => item.destroy({ transaction })),
      );

      // update remained media
      const shouldUpdate = await models.system.GlobalMedia.findAll({
        where: { id: media.map((item) => item.media) },
      });

      await Promise.all(
        shouldUpdate.map((mediaModel) => {
          return mediaModel.updateForResource(
            model,
            media.find((item) => item.media === mediaModel.id)?.metadata,
            transaction,
          );
        }),
      );
    };
  }

  getMediaFromRequest(req, model, attribute) {
    return req.input(attribute);
  }

  /**
   * Resolve the given attribute from the given resource.
   *
   * @param  {any}  resource
   * @param  {string}  attribute
   * @return {any}
   */
  resolveAttribute(resource, attribute) {
    return !Array.isArray(resource.media)
      ? []
      : resource.media
          .filter((media) => media.collection === attribute)
          .map((media) => {
            const conversions = {};
            media.conversions.forEach((conversion) => {
              conversions[conversion.name] = conversion.url;
            });

            return {
              media: media.get('id'),
              url: media.getUrl(),
              conversions: conversions,
              metadata: media.metadata,
            };
          });
  }
};
