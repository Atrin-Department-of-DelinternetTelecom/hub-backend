//@ts-check
'use strict';

const FormDataAction = require('@lib/crud/FormDataAction');
const File = require('@lib/crud/Fields/File');

const { parse } = require('csv-parse');
const Text = require('@lib/crud/Fields/Text');
const NumberField = require('@lib/crud/Fields/Number');
const ArrayField = require('@lib/crud/Fields/Array');
const {
  OperadorLandline,
} = require('@api/models/intranet/intranet_operador_landline');
const { pluck } = require('@api/utils/collections');
const {
  handle: RevisionLandlines,
} = require('@api/service/intranet/Actions/RevisionLandlines');

const existsNumbers = async () => {
  return pluck(
    await OperadorLandline.findAll({
      attributes: ['number'],
      raw: true,
    }),
    'number',
  );
};

const getRecords = (csv, delimiter = ';', exclude = [0]) => {
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

module.exports = class ImportLandlines extends FormDataAction {
  /**
   * Preapre field for json.
   *
   * @param {any} request
   * @param {unknown[]} models
   * @param {{
   *  landlines: {data: Buffer};
   *  delimiter: string;
   *  number_column: number;
   *  fiscal_column: number;
   *  owner_column: number;
   *  provider: string;
   *  revenedor: string;
   *  exclude:Array<number>
   * }} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const exists = await existsNumbers();
    const records = await getRecords(
      fields.landlines.data,
      fields.delimiter,
      fields.exclude,
    );

    const newRecords = records.filter(
      (record) => !exists.includes(record[fields.number_column]),
    );

    await OperadorLandline.bulkCreate(
      newRecords.map((record) => {
        return {
          number: record[fields.number_column],
          fiscal_id: record[fields.fiscal_column],
          owner: record[fields.owner_column],
          provider: fields.provider ?? null,
          revenedor: fields.revenedor ?? null,
        };
      }),
    );

    RevisionLandlines(
      await OperadorLandline.findAll({
        where: {
          number: pluck(newRecords, fields.number_column),
        },
      }),
    ).catch(console.log);
  }

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new File('landlines').rules('mime:csv'),
      new Text('delimiter').default(';'),
      new NumberField('number_column').default(0),
      new NumberField('fiscal_column').default(1),
      new NumberField('owner_column').default(2),
      new Text('provider').default(null).nullable(),
      new Text('revenedor').default(null).nullable(),
      new ArrayField('exclude').default([0]),
    ];
  }
};
