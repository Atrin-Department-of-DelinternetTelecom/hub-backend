'use strict';

const utils = require('@utils/writer');
const Assist = require('@service/intranet/GfAssistService');
const { isResponsePayload } = require('@utils/response');
const { createRoute } = require('@api/utils/controller-factory');
const { getReportByTypeId } = require('@api/service/technician');
const {
  loadDocumentSignatures,
} = require('@api/service/documents/DocumentService');

const { fromEntries, entries } = Object;

module.exports.deleteGfAssistsId = function deleteGfAssistsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Assist.deleteGfAssistsId(id, req.user.id, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfAssists = function getGfAssists(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  Assist.getGfAssists(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfAssistsId = function getGfAssistsId(req, res, next) {
  const id = req.swagger.params.id.value;
  Assist.getGfAssistsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postGfAssists = function postGfAssists(req, res, next) {
  const body = req.swagger.params.body.value;
  Assist.postGfAssists(body, req.user.userId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.putGfAssistsId = function putGfAssistsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  Assist.putGfAssistsId(id, body, req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.patchCancelGfAssistsId = function patchCancelGfAssistsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  const { reasonId, description } = req.swagger.params.body.value;
  Assist.patchCancelGfAssistsId(id, { reasonId, description }, req.user)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getAssistsAddress = function getAssistsAddress(req, res, next) {
  const contractId = req.swagger.params.contractId.value;
  Assist.getAssistsAddress(contractId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getReport = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;

    const report = await getReportByTypeId('incidence/assistance', id);
    const signs = await loadDocumentSignatures(report.docId);

    return {
      ...report,
      signatures: fromEntries(
        entries(signs).map(([k, v]) => [k, v?.toString('base64') ?? null]),
      ),
    };
  },
});

exports.formatContactPhones = createRoute({
  async handler() {
    return Assist.formatContactPhones();
  },
});

module.exports.patchToggleCloseGfAssistsId =
  function patchToggleCloseGfAssistsId(req, res, next) {
    const id = req.swagger.params.id.value;
    Assist.patchToggleCloseGfAssistsId(id, req.user.userId)
      .then(function (response) {
        utils.writeJson(res, response);
      })
      .catch(function (response) {
        utils.writeJson(res, response);
      });
  };
