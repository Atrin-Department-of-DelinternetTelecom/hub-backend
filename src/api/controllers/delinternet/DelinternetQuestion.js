'use strict';

const utils = require('@utils/writer');
const Delinternet = require('@service/delinternet/DelinternetQuestionService');

module.exports.getFaqs = function getFaqs(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Delinternet.getFaqs(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
