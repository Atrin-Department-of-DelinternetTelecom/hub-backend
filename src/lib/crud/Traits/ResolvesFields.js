'use strict';

const _ = require('lodash');
const FieldCollection = require('./../Collections/FieldCollection');
const MergeValue = require('./../MergeValue');

module.exports = class {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [];
  }

  /**
   * Get collection of fields.
   *
   * @param {Object} request
   * @return {any}
   */
  fieldCollection(request) {
    return new FieldCollection(
      _.flatMapDeep(this.fields(request), (field) => {
        return field instanceof MergeValue ? field.flatten : [field];
      }),
    );
  }
};
