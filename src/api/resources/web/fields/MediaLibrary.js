// @ts-check
'use strict';

const Field = require('@lib/crud/Fields/MediaLibrary');

module.exports = class MediaLibrary extends Field {
  /**
   * Hydrate the given attribute on the model based on the incoming request.
   *
   * @param  {object}  request
   * @param  {object}  model
   * @param  {string}  attribute
   * @return {any}
   */
  fillAttributeFromRequest(request, model, attribute) {
    if (!request.has(attribute)) return;

    const callback = super.fillAttributeFromRequest(request, model, attribute);

    return async (request, model, transaction) => {
      await callback(request, model, transaction);

      const callbacks = request
        .input(attribute)
        .filter((media) => media.metadata?.locale !== model.get('locale'))
        .map(async (media) => {
          const translation = await model.constructor.findOne(
            {
              where: {
                group: model.get('group'),
                locale: media.metadata?.locale,
              },
            },
            { transaction },
          );

          if (!translation) return;

          const callback = super.fillAttributeFromRequest(
            request,
            translation,
            attribute,
          );

          return callback(request, translation, transaction);
        });

      await Promise.all(callbacks);
    };
  }

  getMediaFromRequest(req, model, attribute) {
    return req
      .input(attribute)
      .filter((media) => media.metadata?.locale === model.get('locale'));
  }

  /**
   * Resolve the given attribute from the given resource.
   *
   * @param  {any}  resource
   * @param  {string}  attribute
   * @return {any}
   */
  resolveAttribute(resource, attribute) {
    const media = {
      [resource.get('locale')]: resource.media
        .filter((media) => media.collection === attribute)
        .map((media) => {
          return {
            media: media.get('id'),
            metadata: media.metadata,
            url: media.getUrl(),
          };
        })
        .pop(),
    };

    resource.translations.forEach((model) => {
      media[model.get('locale')] = model.media
        .filter((media) => media.collection === attribute)
        .map((media) => {
          return {
            media: media.get('id'),
            metadata: media.metadata,
            url: media.getUrl(),
          };
        })
        .pop();
    });

    return media;
  }
};
