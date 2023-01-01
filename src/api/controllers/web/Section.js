'use strict';

const utils = require('@utils/writer');
const Section = require('@service/web/SectionService');

module.exports.deleteSectionsId = function deleteSectionsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Section.deleteSectionsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSections = function getSections(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Section.getSections(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSectionsId = function getSectionsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Section.getSectionsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postSections = function postSections(req, res, next) {
  const body = req.swagger.params.body.value;
  Section.postSections(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putSectionsId = function putSectionsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Section.putSectionsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
