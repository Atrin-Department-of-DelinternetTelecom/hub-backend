// @ts-check
'use strict';
const BooleanField = require('@lib/crud/Fields/Boolean');
const ID = require('@lib/crud/Fields/ID');
const { isTruthy } = require('@utils/helpers');
const JsonField = require('@lib/crud/Fields/Json');
const MediaLibrary = require('./MediaLibrary');
const models = require('@models');
const NumberField = require('@lib/crud/Fields/Number');
const { Op } = require('sequelize');
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

      new TextField('Language', 'locale').exceptOnForms().default('en'),

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

      new NumberField('Articles')
        .exceptOnForms()
        .hideOnSequelize()
        .resolveUsing((request, model) => model.DelinternetArticles.length),

      new JsonField('Parent', 'category_id')
        .filterable((req, query, value, operator = '=') => {
          query.include.push({
            model: models.system.DelinternetCategory,
            as: 'category',
            required: true,
            where: {
              name: {
                [Op.like]: `%${value.replace(/%/g, '')}%`,
              },
            },
          });
        })
        .sortable()
        .nullable()
        .resolveUsing((value, model) => {
          const values = { [model.get('locale')]: model.category };

          model.translations.forEach((model) => {
            values[model.get('locale')] = model.category;
          });

          return values;
        })
        .fillUsing((request, model, attribute) => {
          if (!request.has(attribute)) return;

          return async (request, model, transaction) => {
            const DelinternetCategory = models.system.DelinternetCategory;
            const category = await DelinternetCategory.findByPk(
              request.input(`${attribute}.${model.get('locale')}`),
              {
                include: [
                  {
                    model: DelinternetCategory,
                    as: 'translations',
                  },
                ],
              },
            );

            if (category === null) {
              // if parent category not found set all to null
              await DelinternetCategory.update(
                { category_id: null },
                {
                  transaction,
                  where: {
                    group: model.get('group'),
                  },
                },
              );

              return;
            }

            const ids = { [category.get('locale')]: category.get('id') };

            category.translations.forEach((category) => {
              ids[category.get('locale')] = category.get('id');
            });

            // update current model
            await model.update({
              category_id: ids[model.get('locale')],
            });

            // merge request by translations
            request.merge(attribute, ids);

            return await this.upsert(request, model, transaction, attribute);
          };
        }),

      new TextField('Name').onlyOnSequelize().required(),

      ...this.urlFields(request),

      new NumberField('Parent', 'category_id')
        .default(null)
        .nullable()
        .onlyOnSequelize()
        .sequelize('set', function (value) {
          this.setDataValue('category_id', Number(value) > 0 ? value : null);
        }),

      new BooleanField('Featured')
        .filterable()
        .sortable()
        .default(false)
        .sequelize('get', function (attribute) {
          return isTruthy(this.getDataValue(attribute)) ? true : false;
        })
        .fillUsing((request, model, attribute) => {
          if (request.has(attribute)) {
            const featured = isTruthy(request.input(attribute)) ? true : false;
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
