'use strict';

const utils = require('@utils/writer');
const Material = require('@service/hrms/MaterialService');

module.exports.getMaterials = function getMaterials(req, res) {
  const url = new URL(req.protocol + '://' + req.get('host'));

  Material.getMaterials(req.query, url)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getMaterialById = function getMaterialById(req, res, next) {
  const url = new URL(req.protocol + '://' + req.get('host'));
  const id = req.swagger.params.id.value;
  Material.getMaterialById(id, url)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postMaterial = function postMaterial(req, res, next) {
  const url = new URL(req.protocol + '://' + req.get('host'));
  Material.postMaterial(req.body, req?.files, req.user.id, url)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postUserMaterial = function postUserMaterial(req, res, next) {
  const url = new URL(req.protocol + '://' + req.get('host'));
  Material.postUserMaterial(req.body, req?.files?.image, req.user.id, url)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.deleteMaterial = function deleteMaterial(req, res, next) {
  const MaterialId = req.swagger.params.id.value;
  Material.deleteMaterial(MaterialId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateMaterial = function updateMaterial(req, res, next) {
  const MaterialId = req.swagger.params.id.value;
  const url = new URL(req.protocol + '://' + req.get('host'));

  Material.updateMaterial(
    MaterialId,
    req.body,
    req.user?.id,
    url,
    req.files?.image,
  )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateUserMaterial = function updateUserMaterial(
  req,
  res,
  next,
) {
  const MaterialId = req.swagger.params.id.value;
  const url = new URL(req.protocol + '://' + req.get('host'));

  Material.updateUserMaterial(
    MaterialId,
    req.body,
    req.user?.id,
    url,
    req.files?.image,
  )
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
