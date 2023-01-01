//@ts-check
'use strict';
const ArrayField = require('@lib/crud/Fields/Array');
const BooleanField = require('@lib/crud/Fields/Boolean');
const { DelinternetArticle } = require('@models').system;
const { GlobalMedia } = require('@models').system;
const ID = require('@lib/crud/Fields/ID');
const Scope = require('@lib/crud/Scope');
const TextField = require('@lib/crud/Fields/Text');
const WebsiteSearchArticle = require('./WebsiteSearchArticle');

module.exports = class WebsiteCategory extends Scope {
  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Object} query
   * @return {Object}
   */
  query(request, query) {
    query.include = [
      {
        model: GlobalMedia,
        as: 'media',
      },
      {
        model: DelinternetArticle,
        active: true,
        include: [
          {
            model: GlobalMedia,
            as: 'media',
          },
        ],
      },
    ];

    return query;
  }

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {Array}
   */
  fields(request) {
    return [
      new ID(),
      new TextField('Locale').filterable(),
      new TextField('Name').filterable().sortable(),
      new TextField('Group').filterable().sortable(),
      new TextField('Slug').filterable().sortable(),
      new TextField('Url')
        .resolveUsing((request, resource) => resource.getUrl())
        .nullable(),
      new BooleanField('Featured').filterable().sortable(),
      new TextField('Desktop').resolveUsing((request, resource) => {
        return resource.media
          .find((media) => media.collection === 'desktop')
          ?.getUrl('thumbnail');
      }),
      new TextField('Mobile').resolveUsing((request, resource) => {
        return resource.media
          .find((media) => media.collection === 'mobile')
          ?.getUrl();
      }),
      new ArrayField('Articles').resolveUsing(async (request, resource) => {
        if (!Array.isArray(resource.DelinternetArticles)) {
          return [];
        }

        const callbacks = resource.DelinternetArticles.map(async (article) => {
          const resource = await new WebsiteSearchArticle(
            article,
          ).serializeForIndex(request);

          return resource.attributes;
        });

        return await Promise.all(callbacks);
      }),
    ];
  }
};
