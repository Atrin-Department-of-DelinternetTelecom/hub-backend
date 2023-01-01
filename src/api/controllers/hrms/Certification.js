'use strict';

const utils = require('@utils/writer');
const Certification = require('@service/hrms/CertificationService');
const { isResponsePayload } = require('@utils/response');

module.exports.deleteCertificationsId = function deleteCertificationsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Certification.deleteCertificationsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCertifications = function getCertifications(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Certification.getCertifications(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCertificationsId = function getCertificationsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Certification.getCertificationsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUserCertificationsId = function getUserCertificationsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Certification.getUserCertificationsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postCertifications = function postCertifications(
  req,
  res,
  next,
) {
  Certification.postCertifications(req.body, req.files.proof_doc)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putCertificationsId = function putCertificationsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Certification.putCertificationsId(id, body, null)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postCertificationsId = function postCertificationsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const proof_doc = req.files.proof_doc;
  const body = req.body;
  Certification.putCertificationsId(id, body, proof_doc)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getCertificationsProofDocId =
  function getCertificationsProofDocId(req, res, next) {
    const id = req.swagger.params.id.value;
    Certification.getCertificationsProofDocId(id)
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
