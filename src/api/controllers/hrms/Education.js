'use strict';

const utils = require('@utils/writer');
const Education = require('@service/hrms/EducationService');
const { isResponsePayload } = require('@utils/response');

module.exports.deleteEducationsId = function deleteEducationsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Education.deleteEducationsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getEducations = function getEducations(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Education.getEducations(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getEducationsId = function getEducationsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Education.getEducationsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUserEducationsId = function getUserEducationsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Education.getUserEducationsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postEducations = function postEducations(req, res, next) {
  Education.postEducations(req.body, req.files.proof_doc)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putEducationsId = function putEducationsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Education.putEducationsId(id, body, null)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postEducationsId = function postEducationsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const proof_doc = req.files.proof_doc;
  const body = req.body;
  Education.putEducationsId(id, body, proof_doc)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getEducationsProofDocId = function getEducationsProofDocId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Education.getEducationsProofDocId(id)
    .then(function (media) {
      if (isResponsePayload(media)) {
        utils.writeJson(res, media);
      } else {
        res.download(media);
      }
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
