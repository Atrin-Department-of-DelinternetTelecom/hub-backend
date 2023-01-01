//@ts-check
'use strict';

const ArrayField = require('@lib/crud/Fields/Array');
const { throwUnless } = require('@utils/helpers');
const File = require('@lib/crud/Fields/File');
const ID = require('@lib/crud/Fields/ID');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');

module.exports = class Media extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),

      new TextField('Collection').required(),

      new File('Media')
        .required()
        .hideOnSequelize()
        .fillUsing((req, model, attribute) => {
          return (req, model) => model.store(req.file(attribute));
        }),

      new NumberField('Order').nullable().default(0),

      new TextField('Url')
        .onlyOnSequelize()
        .nullable()
        .virtual((attr, model) => model.getUrl()),

      new TextField('uri')
        .onlyOnSequelize()
        .nullable()
        .virtual((attr, model) => model.getUri()),

      new ArrayField('Conversions').nullable().virtual((attribute, model) => {
        return model.getMetadata('conversions', []).map((conversion) => {
          return { ...conversion, url: model.getUrl(conversion.name) };
        });
      }),

      new TextField('ResourceName')
        .onlyOnForms()
        .required()
        .fillUsing((req, model, attribute) => {
          if (req.has(attribute)) {
            model.set(
              'model_type',
              req.resource(req.input('resource_name')).model().name,
            );
          }
        }),

      new TextField('ResourceId')
        .onlyOnForms()
        .nullable()
        .fillUsing((req, model, attribute) => {
          if (req.has(attribute)) {
            model.set('model_id', req.input(attribute));
          }
        }),

      new TextField('disk').readonly().fillUsing((req, model) => {
        const resource = req.resource(req.input('resource_name'));

        throwUnless(
          resource.model().hasCollection(model.collection),
          `Collection '${model.collection}' not found.`,
        );

        model.set(
          'disk',
          resource.model().getCollection(model.collection).disk,
        );
      }),

      new TextField('Name').exceptOnForms().nullable(),
      new TextField('Filename').exceptOnForms().nullable(),
      new TextField('Extension').exceptOnForms().nullable(),
      new TextField('ModelType').exceptOnForms().nullable(),
      new TextField('ModelId').exceptOnForms().nullable(),
      new TextField('uuid').exceptOnForms().nullable(),
      new TextField('metadata')
        .onlyOnSequelize()
        .nullable()
        .sequelize('set', function (value) {
          this.setDataValue(
            'metadata',
            typeof value === 'string' ? value : JSON.stringify(value ?? {}),
          );
        })
        .sequelize('get', function () {
          const value = this.getDataValue('metadata');

          return typeof value === 'string' ? JSON.parse(value) : value;
        }),
    ];
  }
};
