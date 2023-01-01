//@ts-check
'use strict';
const BooleanField = require('@lib/crud/Fields/Boolean');
const Enum = require('@lib/crud/Fields/Enum');
const helpers = require('@utils/helpers');
const ID = require('@lib/crud/Fields/ID');
const JsonField = require('@lib/crud/Fields/Json');
const MediaLibrary = require('@lib/crud/Fields/MediaLibrary');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const sequelize = require('sequelize');

module.exports = class Slider extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {?Object} request
   * @return {array}
   */
  fields(request) {
    const sequelizeGet = function (attribute) {
      return this.getDetail(
        attribute,
        ['icon', 'order'].includes(attribute) ? null : {},
      );
    };

    const sequelizeSet = function (value, attribute) {
      return this.setDetail(attribute, value);
    };

    return [
      new ID(),

      new BooleanField('Active')
        .default(false)
        .sortable()
        .filterable()
        .sequelize('get', function (attribute) {
          return helpers.isTruthy(this.getDataValue(attribute)) ? true : false;
        }),

      new Enum('Group')
        .default('*')
        .sortable()
        .filterable()
        .nullable()
        .rules('in:*,home,campaign')
        .options({
          '*': 'Every where',
          home: 'Home',
          campaign: 'Campaign',
        }),

      new JsonField('Title')
        .nullable()
        .virtual(sequelizeGet, sequelizeSet)
        .sortable((req, query, sort, direction) => {
          query.order.push([sequelize.json('detail.title'), direction]);
        })
        .filterable(function (req, query, value, operator = '=') {
          return {
            detail: {
              [this.guessSequelizeOperator('like')]: `%title%${value.replace(
                /%/g,
                '',
              )}%subtitle%`,
            },
          };
        }),

      new JsonField('Caption').nullable().virtual(sequelizeGet, sequelizeSet),

      new JsonField('Link').nullable().virtual(sequelizeGet, sequelizeSet),

      new JsonField('Readmore').nullable().virtual(sequelizeGet, sequelizeSet),

      new NumberField('Order')
        .nullable()
        .default(Date.now())
        .virtual(sequelizeGet, sequelizeSet)
        .sortable((req, query, sort, direction) => {
          query.order.push([sequelize.json('detail.order'), direction]);
        }),

      new MediaLibrary('Desktop')
        .required()
        .creationRules('required')
        .help('example: [{media:1, metadata:{locale:"en"}}]'),

      new MediaLibrary('Mobile')
        .required()
        .creationRules('required')
        .help('example: [{media:1, metadata:{locale:"en"}}]'),

      new JsonField('detail')
        .nullable()
        .onlyOnSequelize()
        .sequelize('set', function (value) {
          this.setDataValue('detail', Slider.toJson(value));
        })
        .sequelize('get', function () {
          return {
            color: null,
            title: {},
            subtitle: {},
            caption: {},
            link: {},
            readmore: {},
            icon: null,
            order: Date.now(),
            ...Slider.fromJson(this.getDataValue('detail')),
          };
        }),
    ];
  }

  /**
   * The field fillUsing callback.
   *
   * @param {Object} req
   * @param {Object} model
   * @param {string} attribute
   * @return {void}
   */
  fillcallback(req, model, attribute) {
    if (req.has(attribute)) {
      const detail = model.get('detail');
      detail[attribute] = req.input(attribute);

      model.set('detail', detail);
    }
  }

  /**
   * Json decode.
   *
   * @param {String} string
   * @returns
   */
  static fromJson(string) {
    try {
      return Object(JSON.parse(string));
    } catch (error) {
      return {};
    }
  }

  /**
   * Json encode.
   *
   * @param {Object} value
   * @returns
   */
  static toJson(value) {
    try {
      if (JSON.parse(value)) return value ?? '{}';
    } catch (error) {
      return JSON.stringify(value);
    }
  }
};
