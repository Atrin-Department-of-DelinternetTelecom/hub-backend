'use strict';

const utils = require('@utils/writer');
const GfConfig = require('@service/intranet/ConfigService');

const { isResponsePayload } = require('@utils/response');
const { createRoute } = require('@api/utils/controller-factory');
const { AireTarifa } = require('@api/service/intranet/AireService');
const to = require('await-to-js').default;

module.exports.getGfConfigs = function getGfConfigs(req, res, next) {
  GfConfig.getGfConfigs()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateGfConfig = function updateGfConfig(req, res, next) {
  const body = req.swagger.params.body.value;
  GfConfig.updateGfConfig(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getGfConfigAvatar = function getGfConfigAvatar(req, res, next) {
  GfConfig.getGfConfigAvatar().then(function (response) {
    if (isResponsePayload(response)) {
      utils.writeJson(res, response);
    } else {
      res.download(response);
    }
  });
};

module.exports.postGfConfigAvatar = function postGfConfigAvatar(
  req,
  res,
  next,
) {
  GfConfig.postGfConfigAvatar(req.files.image)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

exports.getCheckAire = createRoute({
  async handler() {
    const [err, result] = await to(AireTarifa.findOne());

    return {
      success: !!result,
      error: err ?? null,
    };
  },
});
