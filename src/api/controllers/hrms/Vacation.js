'use strict';

const utils = require('@utils/writer');
const Vacation = require('@service/hrms/VacationService');
const { Vacation: VacationModel } = require('@models').system;
const { respondSuccess, isResponsePayload } = require('@utils/response');
const path = require('path');

module.exports.deleteVacationsId = function deleteVacationsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Vacation.deleteVacationsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getVacations = function getVacations(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Vacation.getVacations(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getVacationsbetweenDates = function getVacationsbetweenDates(
  req,
  res,
  next,
) {
  const startDate = req.swagger.params.start_date.value;
  const endDate = req.swagger.params.end_date.value;
  Vacation.getVacationsbetweenDates(startDate, endDate)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getVacationsId = function getVacationsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Vacation.getVacationsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postVacations = function postVacations(req, res, next) {
  const body = req.swagger.params.body.value;
  Vacation.postVacations(body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postVacationsId = function postVacationsId(req, res, next) {
  const id = parseInt(req.swagger.params.id.value);
  let signature = null;
  if (!(req.body.signature_id == undefined || req.body.signature_id === null)) {
    signature = req.body.signature_id;
    delete req.body.signature_id;
  } else {
    signature = req.files.vacationSignature;
  }
  Vacation.putVacationsId(id, req.body)
    .then(async function (response) {
      if (response.payload.code === 200) {
        const fileRecordId = await Vacation.getFileRecordId(
          signature,
          response.payload.data,
        );
        const vacation = await VacationModel.findByPk(response.payload.data.id);
        vacation.signature_id = fileRecordId;
        await vacation.save();
        utils.writeJson(res, respondSuccess(vacation));
      } else {
        utils.writeJson(res, response);
      }
    })
    .catch(function (vacation) {
      utils.writeJson(res, vacation);
    });
};

module.exports.putVacationsId = function putVacationsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Vacation.updateVacationId(id, body)
    .then(async function (vacation) {
      utils.writeJson(res, vacation);
    })
    .catch(function (vacation) {
      utils.writeJson(res, vacation);
    });
};

module.exports.getVacationsOfUserId = function getVacationsOfUserId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Vacation.getVacationsOfUserId(id)
    .then(async function (vacation) {
      utils.writeJson(res, vacation);
    })
    .catch(function (vacation) {
      utils.writeJson(res, vacation);
    });
};

module.exports.getVacationsSignatureId = function getVacationsSignatureId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Vacation.getVacationsSignatureId(id)
    .then(async function (media) {
      if (isResponsePayload(media)) {
        utils.writeJson(res, media);
      } else {
        res.download(media);
      }
    })
    .catch(function (vacation) {
      utils.writeJson(res, vacation);
    });
};

module.exports.postVacationsHtmlFileId = function postVacationsHtmlFileId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Vacation.postVacationsHtmlFileId(id, req.body)
    .then(async function (vacation) {
      utils.writeJson(res, vacation);
    })
    .catch(function (vacation) {
      utils.writeJson(res, vacation);
    });
};

module.exports.getVacationsHtmlFileId = function getVacationsHtmlFileId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Vacation.getVacationsHtmlFileId(id)
    .then(function (media) {
      if (isResponsePayload(media)) {
        utils.writeJson(res, media);
      } else {
        res.download(media);
      }
    })
    .catch(function (media) {
      utils.writeJson(res, media);
    });
};

module.exports.getSignedDocFileId = function getSignedDocFileId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Vacation.getSignedDocFileId(id)
    .then(function (media) {
      if (isResponsePayload(media)) {
        utils.writeJson(res, media);
      } else {
        res.download(media);
      }
    })
    .catch(function (media) {
      utils.writeJson(res, media);
    });
};

module.exports.postSignedDocFileId = function postSignedDocFileId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Vacation.postSignedDocFileId(id, req.files.signDoc)
    .then(async function (vacation) {
      utils.writeJson(res, vacation);
    })
    .catch(function (vacation) {
      utils.writeJson(res, vacation);
    });
};

module.exports.getSignedDocImageId = function getSignedDocImageId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  Vacation.getSignedDocImageId(id)
    .then(function (media) {
      if (isResponsePayload(media)) {
        utils.writeJson(res, media);
      } else {
        res.download(media);
      }
    })
    .catch(function (media) {
      utils.writeJson(res, media);
    });
};
