'use strict';

const utils = require('@utils/writer');
const Category = require('@service/web/CategoryService');

module.exports.deleteCategoriesId = function deleteCategoriesId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Category.deleteCategoriesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCategories = function getCategories(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Category.getCategories(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCategoriesId = function getCategoriesId(req, res, next) {
  const id = req.swagger.params.id.value;
  Category.getCategoriesId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postCategories = function postCategories(req, res, next) {
  const body = req.swagger.params.body.value;
  Category.postCategories(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putCategoriesId = function putCategoriesId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Category.putCategoriesId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getAllCategoriesInformation =
  function getAllCategoriesInformation(req, res, next) {
    req.query.url =
      req.protocol +
      '://' +
      req.get('host') +
      req.url.slice(0, req.url.indexOf('?'));
    Category.getAllCategoriesInformation(req.query)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getSectionsOfCategories = function getSectionsOfCategories(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Category.getSectionsOfCategories(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.attachCategoriesToPack = function attachCategoriesToPack(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;
  Category.attachCategoriesToPack(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getHomePageFees = function getHomePageFees(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Category.getHomePageFees(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
