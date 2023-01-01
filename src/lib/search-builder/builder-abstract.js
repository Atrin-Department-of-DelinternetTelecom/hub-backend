'use strict';

const qs = require('qs');
const _ = require('lodash');
const config = require('./config');

class BuilderAbstract {
  /**
   * @param {Object} Sequelize
   * @param {(Object|string)} request
   */
  constructor(request = {}) {
    if (new.target === BuilderAbstract) {
      throw new TypeError(
        'Cannot construct BuilderAbstract instances directly',
      );
    }
    this.request = BuilderAbstract.prepareRequest(request);
    this.setConfig(config);
  }

  /**
   * Set Builder configs
   *
   * @param {Object} value - config options
   *
   * @returns {this}
   */
  setConfig(value) {
    if (value !== null && typeof value === 'object') {
      this.config = _.merge(this.config, value);
    } else {
      console.error('Config parameter should be an object');
    }

    return this;
  }

  /**
   * Transform request to request object
   * @param {(Object|string)} request
   *
   * @returns {Object}
   */
  static prepareRequest(request = {}) {
    if (typeof request === 'string') {
      // here have to replace `+` sign because qs package convert it to `blank`!!!
      // refer here: https://github.com/ljharb/qs/issues/277
      const encodedPlus = encodeURIComponent(`+`);
      const params = qs.parse(request.replace('+', encodedPlus), {
        ignoreQueryPrefix: true,
        strictNullHandling: true,
      });

      return JSON.parse(JSON.stringify(params).replace(encodedPlus, '+'));
    }

    return request || {};
  }
}

module.exports = BuilderAbstract;
