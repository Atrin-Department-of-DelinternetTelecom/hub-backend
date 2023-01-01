// @ts-check
'use strict';
const ArrayField = require('@lib/crud/Fields/Array');
const BooleanField = require('@lib/crud/Fields/Boolean');
const DateField = require('@lib/crud/Fields/DateTime');
const helpers = require('@utils/helpers');
const ID = require('@lib/crud/Fields/ID');
const JsonField = require('@lib/crud/Fields/Json');
const MediaLibrary = require('./MediaLibrary');
const models = require('@models');
const ResolvesFields = require('./ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');

module.exports = class Category extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {?Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),

      new TextField('Language', 'locale')
        .exceptOnForms()
        .default('en')
        .sortable()
        .filterable(),

      new TextField('Group')
        .nullable()
        .default('')
        .hideWhenUpdating()
        .sequelize('set', function (value) {
          this.setDataValue('group', value || Date.now().toString());
        }),

      new JsonField('Name')
        .filterable()
        .sortable()
        .required()
        .creationRules('required')
        .resolveUsing(this.resolveJsonCallback)
        .fillUsing((request, model, attribute) => {
          return this.fillCallback(request, model, attribute);
        }),

      new JsonField('Slug')
        .filterable()
        .sortable()
        .nullable()
        .resolveUsing(this.resolveJsonCallback)
        .fillUsing((request, model, attribute) => {
          return this.fillCallback(request, model, attribute);
        }),

      new JsonField('Summary')
        .required()
        .resolveUsing(this.resolveJsonCallback)
        .fillUsing((request, model, attribute) => {
          return this.fillCallback(request, model, attribute);
        }),

      new JsonField('Content')
        .required()
        .resolveUsing(this.resolveJsonCallback)
        .fillUsing((request, model, attribute) => {
          return this.fillCallback(request, model, attribute);
        }),

      new DateField('Release Date').nullable(),

      new DateField('Archive Date').nullable(),

      new BooleanField('Active')
        .filterable()
        .sortable()
        .default(false)
        .sequelize('get', function (attribute) {
          return helpers.isTruthy(this.getDataValue(attribute)) ? true : false;
        })
        .fillUsing((request, model, attribute) => {
          if (request.has(attribute)) {
            const active = helpers.isTruthy(request.input(attribute));
            const resource = request.resource();

            return async (request, model, transaction) => {
              await resource.model().update(
                { active },
                {
                  transaction,
                  where: {
                    group: model.get('group'),
                  },
                },
              );
            };
          }
        }),

      new BooleanField('Featured')
        .filterable()
        .sortable()
        .default(false)
        .sequelize('get', function (attribute) {
          return helpers.isTruthy(this.getDataValue(attribute)) ? true : false;
        })
        .fillUsing((request, model, attribute) => {
          if (request.has(attribute)) {
            const featured = helpers.isTruthy(request.input(attribute));
            const resource = request.resource();

            return async (request, model, transaction) => {
              await resource.model().update(
                { featured },
                {
                  transaction,
                  where: {
                    group: model.get('group'),
                  },
                },
              );
            };
          }
        }),

      new ArrayField('Categories', 'category')
        .required()
        .rules('required')
        .default([])
        .typeOf('object')
        .help('example: [{group:65465465, ...}]')
        .hideOnSequelize()
        .hideOnIndex()
        .filterable((request, query, value, operator) => {
          query.include.push({
            model: models.system.DelinternetCategory,
            as: 'categories',
            left: true,
            where: {
              group: value,
            },
          });
        })
        .fillUsing(function (request, model, attribute) {
          if (!request.has(attribute)) return;

          return async (req, model, transaction) => {
            const callbacks = await req
              .resource()
              .model()
              .findAll({ where: { group: model.get('group') } })
              .then(async (articles) => {
                const Model = models.system.DelinternetCategory;
                const categories = await Model.findAll({
                  where: {
                    group: request.input(attribute).map((item) => item.id),
                  },
                });

                return articles.map((article) => {
                  // sync categories if was in request.
                  return article.setCategories(
                    categories
                      .filter((category) => {
                        return category.get('locale') === article.get('locale');
                      })
                      .map((category) => category.get('id')),
                    { transaction },
                  );
                });
              });

            await Promise.all(callbacks);
          };
        })
        .resolveUsing((value, model) => {
          return model.categories.map((category) => {
            const name = { [category.get('locale')]: category.name };

            category.allTranslations.forEach((category) => {
              name[category.get('locale')] = category.name;
            });

            return {
              id: category.group,
              name: name,
            };
          });
        }),

      new ArrayField('Tags', 'tag')
        .nullable()
        .default([])
        .typeOf('object')
        .help('example: [{group:65465465, ...}]')
        .hideOnSequelize()
        .hideOnIndex()
        .filterable((request, query, value, operator) => {
          query.include.push({
            model: models.system.DelinternetTag,
            as: 'tags',
            left: true,
            where: {
              group: value,
            },
          });
        })
        .fillUsing(function (request, model, attribute) {
          if (!request.has(attribute)) return;

          return async (req, model, transaction) => {
            const callbacks = await req
              .resource()
              .model()
              .findAll({ where: { group: model.get('group') } })
              .then(async (articles) => {
                const Model = models.system.DelinternetTag;
                const tags = await Model.findAll({
                  where: {
                    group: request.input(attribute).map((item) => item.id),
                  },
                });

                return articles.map((article) => {
                  // sync Tags if was in request.
                  return article.setTags(
                    tags
                      .filter((tag) => {
                        return tag.get('locale') === article.get('locale');
                      })
                      .map((tag) => tag.get('id')),
                    { transaction },
                  );
                });
              });

            await Promise.all(callbacks);
          };
        })
        .resolveUsing((value, model) => {
          return model.tags.map((tag) => {
            const name = { [tag.get('locale')]: tag.name };

            tag.allTranslations.forEach((tag) => {
              name[tag.get('locale')] = tag.name;
            });

            return {
              id: tag.group,
              name: name,
            };
          });
        }),

      new TextField('Name').rules('required').onlyOnSequelize().required(),

      ...this.urlFields(request),

      new TextField('Summary').onlyOnSequelize().nullable(),
      new JsonField('Content').onlyOnSequelize().nullable(),
      new MediaLibrary('Desktop')
        .required()
        .creationRules('required')
        .help('example: [{media:1, metadata:{locale:"en"}}]'),

      new MediaLibrary('Mobile')
        .required()
        .creationRules('required')
        .help('example: [{media:1, metadata:{locale:"en"}}]'),
    ];
  }
};
