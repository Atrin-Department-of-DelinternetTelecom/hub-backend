//@ts-check
'use strict';

const ID = require('@lib/crud/Fields/ID');
const { GfAssist } = require('@models').intranet;
const Resource = require('@lib/crud/Resource');
const DateTime = require('@lib/crud/Fields/DateTime');

module.exports = class GfAssistance extends Resource {
  /**
   * Prevent to configure swagger for `CRUD`.
   *
   * @type {Boolean}
   */
  preventSwagger = true;

  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      // TODO: ismail
      new ID(),
      new DateTime('creationDate', 'creationDate')
        .nullable()
        .sortable()
        .filterable(),
      new DateTime('updateDate', 'updateDate')
        .nullable()
        .sortable()
        .filterable(),
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return GfAssist;
  }
};
