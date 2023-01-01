//@ts-check
'use strict';

const FormDataAction = require('@lib/crud/FormDataAction');
const File = require('@lib/crud/Fields/File');

const { parse } = require('csv-parse');
const Text = require('@lib/crud/Fields/Text');
const NumberField = require('@lib/crud/Fields/Number');
const ArrayField = require('@lib/crud/Fields/Array');
const { pluck } = require('@api/utils/collections');
const {
  OperadorReseller,
} = require('@api/models/intranet/intranet_operador_reseller');

/**
 * @returns {Promise<string[]>}
 */
const existsResellers = async () => {
  return pluck(
    await OperadorReseller.findAll({
      attributes: ['name'],
      raw: true,
    }),
    'name',
  );
};

const getRecords = (csv, delimiter = ';', exclude = []) => {
  return new Promise((resolve, reject) => {
    parse(
      csv,
      { auto_parse: true, delimiter: delimiter, encoding: 'latin1' },
      (error, records) => {
        if (error) {
          reject(error);
        }
        // update database
        resolve(records.filter((_, index) => !exclude.includes(index)));
      },
    );
  });
};

module.exports = class ImportResellers extends FormDataAction {
  /**
   * Preapre field for json.
   *
   * @param {any} request
   * @param {unknown[]} models
   * @param {{
   *  resellers: {data: Buffer};
   *  delimiter: string;
   *  name_column: string;
   *  exclude:Array<number>
   * }} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const exists = await existsResellers();
    const records = await getRecords(
      fields.resellers.data,
      fields.delimiter,
      fields.exclude,
    );

    const newRecords = records.filter(
      (record) => !exists.includes(record[fields.name_column]),
    );

    await OperadorReseller.bulkCreate(
      newRecords.map((record) => Object({ name: record[fields.name_column] })),
    );
  }

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new File('resellers').rules('mime:csv'),
      new Text('delimiter').default(';'),
      new NumberField('name_column').default(0),
      new ArrayField('exclude').default([0]),
    ];
  }
};
