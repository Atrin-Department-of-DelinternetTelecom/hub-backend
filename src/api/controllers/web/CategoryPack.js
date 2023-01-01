'use strict';

const utils = require('@utils/writer');
const CategoryPack = require('@service/web/CategoryPackService');

module.exports.deleteCategoriesPacksId = function deleteCategoriesPacksId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  CategoryPack.deleteCategoriesPacksId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCategoriesPacks = function getCategoriesPacks(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  CategoryPack.getCategoriesPacks(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCategoriesPacksId = function getCategoriesPacksId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  CategoryPack.getCategoriesPacksId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postCategoriesPacks = function postCategories(req, res, next) {
  const body = req.swagger.params.body.value;
  CategoryPack.postCategoriesPacks(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putCategoriesPacksId = function putCategoriesPacksId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  CategoryPack.putCategoriesPacksId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
