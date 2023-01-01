'use strict';

const diarioJson = require('./diario.json');
const subcuentasJson = require('./subcuentas.json');
const _ = require('lodash');
const moment = require('moment');

/**
 * copied from iadmin php code
 * by mostafa
 * Core_Sage_Contaplus
 */
class SageContaplus {
  diarioSchema = {};
  subcuentasSchema = {};

  diario = [];
  subCuentas = new Map();

  constructor() {
    _.map(diarioJson, (value) => {
      this.diarioSchema[value.campo] = value;
    });

    _.map(subcuentasJson, (value) => {
      this.subcuentasSchema[value.campo] = value;
    });
  }

  assingJsonToLocal = (obj, json) => {
    _.map(json, (value) => {
      obj[value.campo] = value;
    });
  };

  subCuentaExists = (subCuentaId) => {
    if (!this.subCuentas.get(subCuentaId)) return false;
    return true;
  };

  addDiario = (data) => {
    if (!this.subCuentas.get(data.SubCta)) {
      throw new Error(
        `subCuenta ${data.SubCta} not found, provide SubCuenta first`,
      );
    }
    _.map(data, (value, key) => {
      const { success, reason } = this._validateValue('diario', key, value);
      if (!success) {
        console.log(reason);
        throw new Error(`Field ${key} set to`);
      }
      data[key] = this._formatValue('diario', key, value);
    });
    this.diario.push(data);
    return true;
  };

  addSubCuenta(data) {
    if (!data.Cod) {
      throw new Error('No Cod provided');
    }
    _.map(data, (value, key) => {
      const validation = this._validateValue('subcuentas', key, value);
      if (!validation.success) {
        throw new Error(
          `Field ${key} set to ${value} not validate: ${validation.reason}`,
        );
      }
      data[key] = this._formatValue('subcuentas', key, value);
    });
    this.subCuentas.set(data.Cod, data);
    return true;
  }

  isNumeric(num) {
    return !isNaN(num);
  }

  _validateValue = (dic, name, value) => {
    const type = this[`${dic}Schema`][name];

    // name is not a valid field
    if (!type) {
      return {
        success: false,
        reason: `${name} is not a valid field`,
      };
    }

    // Value string too long
    if (_.toString(value).length > type.lon) {
      return {
        success: false,
        reason: `${value} string too long`,
      };
    }

    // Type F must be 8 characters long or empty
    if (type.tipo === 'F' && _.toString(value).length != 8 && value != '') {
      return {
        success: false,
        reason: `Type F must be 8 characters long or empty`,
      };
    }

    if (value == '') {
      return {
        success: true,
        reason: '',
      };
    }
    let reason = '';
    let success = false;
    switch (type.tipo) {
      case 'N':
        success = this.isNumeric(value);
        break;
      case 'C':
        success = true;
        break;
      case 'F': {
        // let year = value.slice(0, 4);
        // let month = value.slice(4, 6);
        // let month = value.slice(6, 8);
        const m = moment(value);
        success = m.isValid();
        break;
      }
      case 'L':
        success = _.isBoolean(value);
        break;
    }
    if (!success) {
      reason = `Type ${type.tipo} don't match`;
    }
    return { success, reason };
  };

  getSubcuentas = () => {
    return this._getResultSubCuentas(this.subCuentas, this.subcuentasSchema);
  };

  getDiario = () => {
    return this._getResult(this.diario, this.diarioSchema);
  };

  _getResult = (obj, schema) => {
    const csvLines = [];
    _.map(obj, (line) => {
      const fields = [];
      _.map(schema, (sch) => {
        fields[parseInt(sch.pos) - 1] = line[sch.campo];
      });
      const _line = fields.join(';');
      csvLines.push(_line);
    });
    const csv = csvLines.join('\r\n');
    return csv;
  };

  _getResultSubCuentas = (map, schema) => {
    const csvLines = [];
    for (const [index, line] of map) {
      const fields = [];
      _.map(schema, (sch) => {
        fields[parseInt(sch.pos) - 1] = line[sch.campo];
      });
      const _line = fields.join(';');
      csvLines.push(_line);
    }

    const csv = csvLines.join('\r\n');
    return csv;
  };

  getDiarioAbstract = () => {
    return this.diario;
  };

  getSubcuentasAbstract = () => {
    return this.subCuentas;
  };

  /**
   *
   * @param {any} dic
   * @param {string} name
   * @param {number} value
   * @returns
   */
  _formatValue = (dic, name, value) => {
    const type = this[`${dic}Schema`][name];
    let res;
    switch (type.tipo) {
      case 'N':
        res = type.ignoreDecimals
          ? Number(value).toFixed()
          : Number(value).toFixed(2);
        break;
      case 'C':
        res = value;
        break;
      case 'F':
        res = value;
        break;
      case 'L':
        res = value ? 'T' : 'F';
        break;
    }
    return res;
  };
}

module.exports = SageContaplus;
