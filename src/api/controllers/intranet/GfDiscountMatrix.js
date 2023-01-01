'use strict';

const utils = require('@utils/writer');
const DiscountMatrix = require('@service/intranet/GfDiscountMatrixService');

module.exports.createGfDiscountsMatrix = function createGfDiscountsMatrix(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;

  DiscountMatrix.createGfDiscountsMatrix(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfDiscountsMatrix = function getGfDiscountsMatrix(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  DiscountMatrix.getGfDiscountsMatrix(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfDiscountsAbstract = function getGfDiscountsAbstract(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  DiscountMatrix.getGfDiscountsAbstract(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfDiscountsMatrixId = function getGfDiscountsMatrixId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  DiscountMatrix.getGfDiscountsMatrixId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfDiscountsByfeeGroupLabel =
  function getGfDiscountsByfeeGroupLabel(req, res, next) {
    const id = req.swagger.params.feeGroupLabelId.value;

    DiscountMatrix.getGfDiscountsByfeeGroupLabel(id)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };

module.exports.getDiscountsGraph = function getDiscountsGraph(req, res, next) {
  const removeInactiveMatrices =
    req.query.removeInactiveMatrices === 'true' ||
    req.query.removeInactiveMatrices === true;
  const removeInactiveFees =
    req.query.removeInactiveFees === 'true' ||
    req.query.removeInactiveFees === true;

  DiscountMatrix.getDiscountsGraph({
    removeInactiveMatrices,
    removeInactiveFees,
  })
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateGfDiscountsMatrix = function updateGfDiscountsMatrix(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  DiscountMatrix.updateGfDiscountsMatrix(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteGfDiscountsMatrix = function deleteGfDiscountsMatrix(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  DiscountMatrix.deleteGfDiscountsMatrix(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
