//@ts-check
'use strict';
const ArrayField = require('@lib/crud/Fields/Array');
const BooleanField = require('@lib/crud/Fields/Boolean');
const { DelinternetCategory } = require('@models').system;
const { GlobalMedia } = require('@models').system;
const ID = require('@lib/crud/Fields/ID');
const Scope = require('@lib/crud/Scope');
const TextField = require('@lib/crud/Fields/Text');

module.exports = class WebsiteSearchArticle extends Scope {
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
        model: DelinternetCategory,
        as: 'categories',
        required: request.hasFilter('categories'),
        where: !request.hasFilter('categories')
          ? {}
          : { id: request.filter('categories').value },
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
      new BooleanField('Active').filterable(),
      new TextField('Locale').filterable(),
      new TextField('Name').filterable().sortable(),
      new TextField('Group').filterable().sortable(),
      new TextField('Slug').filterable().sortable(),
      new TextField('Url')
        .resolveUsing((request, resource) => resource.getUrl())
        .nullable(),
      new TextField('Content')
        .filterable()
        .sortable()
        .resolveUsing((request, resource) => resource.content?.html),

      new TextField('CreatedAt', 'createdAt').filterable().sortable(),
      new TextField('UpdatedAt', 'updatedAt').filterable().sortable(),
      new TextField('Summary').filterable().sortable(),
      new BooleanField('Featured').filterable().sortable(),

      new TextField('Large').resolveUsing((request, resource) => {
        return resource.media
          .find((media) => media.collection === 'desktop')
          ?.getUrl('large');
      }),
      new TextField('Thumbnail').resolveUsing((request, resource) => {
        return resource.media
          .find((media) => media.collection === 'desktop')
          ?.getUrl('thumb');
      }),
      new TextField('Mobile').resolveUsing((request, resource) => {
        return resource.media
          .find((media) => media.collection === 'mobile')
          ?.getUrl('mobile');
      }),

      new ArrayField('Categories')
        .filterable(() => {})
        .resolveUsing((request, resource) => {
          if (!resource.categories) return [];

          return resource.categories.map((category) => {
            return {
              id: category.id,
              name: category.name,
              url: category.getUrl(),
            };
          });
        }),
    ];
  }
};
