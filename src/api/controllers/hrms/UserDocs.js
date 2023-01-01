'use strict';

const utils = require('@utils/writer');
const UserDocs = require('@service/hrms/UserDocsService');
const { isResponsePayload } = require('@utils/response');
const _ = require('lodash');
module.exports.deleteUserDocsId = function deleteUserDocsId(req, res, next) {
  const id = req.swagger.params.id.value;
  UserDocs.deleteUserDocsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUserDocs = function getUserDocs(req, res, next) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  UserDocs.getUserDocs(req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUserDocsId = function getUserDocsId(req, res, next) {
  const id = req.swagger.params.id.value;
  UserDocs.getUserDocsId(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUserDocsOfUserId = function getUserDocsOfUserId(
  req,
  res,
  next,
) {
  req.query.url =
    req.protocol +
    '://' +
    req.get('host') +
    req.url.slice(0, req.url.indexOf('?'));
  const id = req.swagger.params.id.value;
  UserDocs.getUserDocsOfUserId(id, req.query)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUserDocsFileId = function getUserDocsFileId(req, res, next) {
  const id = req.swagger.params.id.value;
  UserDocs.getUserDocsFileId(id)
    .then(function (response) {
      if (isResponsePayload(response)) {
        utils.writeJson(res, response);
      } else {
        res.download(response);
      }
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

// user created file by own
module.exports.postUserDocs = function postUserDocs(req, res, next) {
  const swagger_owner_id = req.swagger.params.owner_id.value;

  req.body.owner_id = !_.isUndefined(swagger_owner_id)
    ? swagger_owner_id
    : req.user.id;

  req.body.creator_id = req.user.id;
  req.body.folder_id = req.swagger.params.folder_id.value || 1;
  UserDocs.postUserDocs(req.body, req.files.document)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

// this is update of user docs => here user can update own doc or admin signed doc
module.exports.postUserDocsId = function postUserDocsId(req, res, next) {
  const id = req.swagger.params.id.value;
  UserDocs.postUserDocsId(id, req.body, req.files.document, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

// this is update of user docs => here user can update own doc or admin signed doc
module.exports.putUserDocsId = function putUserDocsId(req, res, next) {
  const id = req.swagger.params.id.value;
  const body = req.swagger.params.body.value;
  req.body.creator_id = req.user.id; //TODO: change to user that authed
  UserDocs.putUserDocsId(id, body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.postSignUserDocsId = function postSignUserDocsId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  UserDocs.postSignUserDocsId(id, req.files.signature)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getSignUserDocsFileId = function getSignUserDocsFileId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  UserDocs.getSignUserDocsFileId(id)
    .then(function (response) {
      if (isResponsePayload(response)) {
        utils.writeJson(res, response);
      } else {
        res.download(response);
      }
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getUserDocsImageId = function getUserDocsImageId(
  req,
  res,
  next,
) {
  const id = req.swagger.params.id.value;
  UserDocs.getUserDocsImageId(id)
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
