'use strict';

const utils = require('@utils/writer');
const DownloadFile = require('@service/global/DownloadFileService');
const { isResponsePayload } = require('@utils/response');

module.exports.getDownloadFileId = function getDownloadFileId(req, res, next) {
  const id = req.swagger.params.id.value;
  DownloadFile.getDownloadFileId(id)
    .then(async function (media) {
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
