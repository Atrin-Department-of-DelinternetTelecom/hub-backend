'use strict';

// read credential data for auth
require('dotenv').config();

//google libs for use authenticate
const { google } = require('googleapis');

const config = require('@config');
const { Op } = require('sequelize');
const { SHEET } = require('./permissions');

// get config
const getCredential = () => {
  return {
    client_email: config.get('index.serviceAccount'),
    private_key: config.get('index.paivateKey'),
  };
};

/**
 * @class
 */
exports.GoogleSheet = class GoogleSheet {
  static sheet = null;
  sheetId = null;
  constructor(sheetId) {
    if (!GoogleSheet.sheet) {
      const credentials = getCredential();
      const auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        [SHEET],
      );
      GoogleSheet.sheet = google.sheets({ version: 'v4', auth });
    }
    this.sheetId = sheetId;
  }

  async getLastEntityDetail(sheetName) {
    const response = await GoogleSheet.sheet.spreadsheets.values.get({
      spreadsheetId: this.sheetId,
      range: `${sheetName}!A:A`,
    });
    const columnData = response.data.values ?? [];

    let maxId = 0;
    columnData.forEach((columnOrValue) => {
      const id = Number(columnOrValue[0]);
      if (!isNaN(id) && id > maxId) maxId = id;
    });
    return { lastRowInfo: maxId, lastRowIndex: columnData.length };
  }

  // this function must use for database table and copied sheets
  async syncModel(Model, sheetName, fieldsAndMaps) {
    const { lastRowIndex, lastRowInfo: currentId } =
      await this.getLastEntityDetail(sheetName);

    const databaseRows = await Model.findAll({
      where: { id: { [Op.gt]: currentId } },
    });

    if (databaseRows.length) {
      //map database rows and create columns if sheet is empty
      const mappedData = this.converter(databaseRows, fieldsAndMaps);
      const values = !lastRowIndex
        ? [Object.keys(fieldsAndMaps), ...mappedData]
        : mappedData;

      await GoogleSheet.sheet.spreadsheets.values.append({
        spreadsheetId: this.sheetId,
        range: `${sheetName}!A${lastRowIndex + 1}`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values,
        },
      });
    }
  }

  converter(databaserRows, fields) {
    return databaserRows.map((databaseRow) => {
      const row = databaseRow.get({ plain: true });
      const copiedFields = { ...fields };
      const arraedShape = [];
      for (const field in copiedFields) {
        let value = row[field];
        if (fields[field]) value = copiedFields[field](value);
        copiedFields[field] = value;
        arraedShape.push(value);
      }
      return arraedShape;
    });
  }
};
