import { ActionEvent } from '@api/models/crud/crud_action_event';
import { ResourceRequest } from './Request';
import { ResourceResponse } from './Response';

export const destroy = function (req: ResourceRequest, res: ResourceResponse) {
  req
    .findResourceOrFail()
    .then(async (resource) => {
      // Throw exception if user can not view the resource
      resource.authorizeToDelete(req);
      const model = resource.resource;

      model.sequelize
        .transaction(async (transaction) => {
          // call event before delete model
          await resource.deleting(req, model);

          if (
            //@ts-ignore
            model.constructor.options.paranoid !== true &&
            model._isAttribute('status')
          ) {
            // to handle intranet soft delete
            await model.update({ status: 0 }, { transaction });
          } else {
            await model.destroy({ transaction });
          }

          await ActionEvent.forResourceDelete({
            payload: req.all(),
            userId: req.userId(),
            resource: model,
          }).markAsFinished();

          // call event after delete model
          await resource.deleted(req, model);

          return model;
        })
        .then((model) => res.respondDeleted(model))
        .catch((error) => res.respondError(error));
    })
    .catch((error) => res.respondError(error));
};
