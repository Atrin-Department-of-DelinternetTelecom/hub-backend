'use strict';

const utils = require('@utils/writer');
const GfCellProviderFee = require('@service/intranet/GfCellProviderFeesService');
const CellContracts = require('@service/intranet/CellContractsService');

module.exports.checkBonosChange = function checkBonosChange(req, res, next) {
  CellContracts.checkBonosChange()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.importFees = function importFees(req, res, next) {
  const loadAllLemonPackages = req.query.loadAllLemonPackages === 'true';

  GfCellProviderFee.importFees(loadAllLemonPackages)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.syncFeesToLocal = function syncFeesToLocal(req, res, next) {
  GfCellProviderFee.syncFeesToLocal()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.importAllBonus = function importAllBonus(req, res, next) {
  GfCellProviderFee.importAllBonus()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.createGfCellProviderFee = function createGfCellProviderFee(
  req,
  res,
  next,
) {
  const body = req.swagger.params.body.value;

  GfCellProviderFee.createGfCellProviderFee(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfCellProviderFee = function getGfCellProviderFee(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));

  GfCellProviderFee.getGfCellProviderFee(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfCellProviderFeeId = function getGfCellProviderFeeId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  GfCellProviderFee.getGfCellProviderFeeId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateGfCellProviderFee = function updateGfCellProviderFee(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  GfCellProviderFee.updateGfCellProviderFee(id, req.body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteGfCellProviderFee = function deleteGfCellProviderFee(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;

  GfCellProviderFee.deleteGfCellProviderFee(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.initLemonTarifas = function initLemonTarifas(req, res, next) {
  GfCellProviderFee.initLemonTarifas()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.modifyLemonTarifas = function modifyLemonTarifas(req, res, next) {
  GfCellProviderFee.modifyLemonTarifas()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
