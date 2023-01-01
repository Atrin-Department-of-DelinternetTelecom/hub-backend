'use strict';

const utils = require('@utils/writer');
const HeapdumpService = require('@service/delinternet/HeapdumpService');

module.exports.createHeapdump = function createHeapdump(req, res, next) {
  HeapdumpService.createHeapdump()
    .then((response) => {
      utils.writeJson(res, response);
    })
    .catch((error) => {
      console.error('[HeapdumpController] Unhandled error:', error);
      utils.writeJson(res, {
        status: false,
        message: 'Unexpected server error',
        error: error.message,
      });
    });
};
