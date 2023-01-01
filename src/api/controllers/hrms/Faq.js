'use strict';

const utils = require('@utils/writer');
const Faq = require('@service/hrms/FaqService');

module.exports.getFaqs = function getFaqs(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  Faq.getFaqs(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFaqById = function getFaqById(req, res, next) {
  const id = req.swagger.params.id.value;
  Faq.getFaqById(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postFaq = function postFaq(req, res, next) {
  const body = req.swagger.params.body.value;
  Faq.postFaq(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteFaq = function deleteFaq(req, res, next) {
  const faqId = req.swagger.params.id.value;
  Faq.deleteFaq(faqId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateFaq = function updateFaq(req, res, next) {
  const faqId = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;

  Faq.updateFaq(faqId, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
