//@ts-check
'use strict';
const BooleanField = require('@lib/crud/Fields/Boolean');
const Enum = require('@lib/crud/Fields/Enum');
const helpers = require('@utils/helpers');
const ID = require('@lib/crud/Fields/ID');
const JsonField = require('@lib/crud/Fields/Json');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');

module.exports = class Hotlink extends ResolvesFields {
  /**
   * Get the list of fields.
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

      new Enum('Group').default('*').sortable().filterable().options({
        '*': 'A tot arreu',
        home: 'Home',
        tv: 'TV',
        partners: 'Partners',
        services: 'Services',
        features: 'Features',
      }),

      new Enum('Color')
        .options({
          pink: 'pink',
          gray: 'gray',
          blue: 'blue',
          cyan: 'cyan',
          indigo: 'indigo',
          primary: 'primary',
          secondary: 'secondary',
          danger: 'danger',
          warning: 'warning',
        })
        .nullable()
        .default('primary')
        .virtual(sequelizeGet, function (value) {
          return this.setDetail('color', value);
        }),

      new JsonField('Title')
        .nullable()
        .virtual(sequelizeGet, sequelizeSet)
        .sortable(function (request, query, sort, direction) {
          query.order.push(['detail', direction]);

          return query;
        })
        .filterable(function (request, query, value) {
          return {
            detail: {
              [this.guessSequelizeOperator('like')]: `%${value.replace(
                /%/g,
                '',
              )}%`,
            },
          };
        }),

      new JsonField('Subtitle').nullable().virtual(sequelizeGet, sequelizeSet),

      new JsonField('Caption').nullable().virtual(sequelizeGet, sequelizeSet),

      new JsonField('Link').nullable().virtual(sequelizeGet, sequelizeSet),

      new JsonField('Readmore').nullable().virtual(sequelizeGet, sequelizeSet),

      new TextField('Icon')
        .nullable()
        .default('')
        .virtual(sequelizeGet, sequelizeSet),

      new NumberField('Order')
        .nullable()
        .default(Date.now())
        .virtual(sequelizeGet, sequelizeSet),

      new JsonField('detail')
        .nullable()
        .onlyOnSequelize()
        .sequelize('set', function (value) {
          this.setDataValue('detail', Hotlink.toJson(value));
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
            ...Hotlink.fromJson(this.getDataValue('detail')),
          };
        }),
    ];
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
