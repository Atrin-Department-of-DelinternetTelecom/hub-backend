'use strict';

const utils = require('@utils/writer');
const test = require('@utils/bull').getBullQ('test');

module.exports.newJob = function getVacationsId(req, res, next) {
  const job = {
    _meta: {
      _user: req.user,
      _command: 'test-job',
    },
    title: 'new-job',
    date: new Date(),
  };
  test.add(job);
  utils.writeJson(res, { done: true });
};
