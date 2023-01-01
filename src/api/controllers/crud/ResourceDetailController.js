//@ts-check
'use strict';

module.exports.show = function (request, res, next) {
  request
    .findResourceOrFail()
    .then((resource) => {
      // Throw exception if user can not view the resource
      resource.authorizeToView(request);

      resource.serializeForDetail(request).then((data) => {
        res.respondUpdated(data.attributes);
      });
    })
    .catch((error) => res.respondError(error));
};
