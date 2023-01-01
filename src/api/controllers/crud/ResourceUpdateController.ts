import { ActionEvent } from '@api/models/crud/crud_action_event';
import Field from '@lib/crud/Field';
import { ResourceRequest } from './Request';
import { ResourceResponse } from './Response';

export const update = function (req: ResourceRequest, res: ResourceResponse) {
  req
    .findResourceOrFail()
    .then(async (resource) => {
      const model = resource.resource;
      // Throw exception if user can not update the resource
      resource.authorizeToUpdate(req);
      // Throw exception if request has invalid data
      await resource.validateForUpdate(req);

      model.sequelize
        .transaction(async (transaction) => {
          const fields = resource
            .fieldCollection(req)
            .forUpdating()
            .authorize(req, model)
            .all() as Field[];
          // fill model attributes
          const callbacks = fields.map((field) => field.fill(req, model));

          // call event before save model
          await resource.updating(req, model);
          await resource.saving(req, model);

          const [hook, hookName] = ['afterUpdate', 'resourceUpdated'];
          let eventCalled = false;
          //@ts-ignore
          model.constructor.addHook(hook, hookName, async (model, options) => {
            eventCalled = true;
            model.constructor.removeHook(hook, hookName);
            // Attenction:
            // Here we have to run the "callbacks" in order
            // To avoid duplicate data insertion at the same time
            // Using "Promise.all" here will give the wrong result
            for (const callback of callbacks) {
              if (typeof callback === 'function') {
                await callback(req, model, transaction);
              }
            }

            // call event after save model
            await resource.updated(req, model);
            await resource.saved(req, model);

            await ActionEvent.forResourceUpdate({
              payload: req.all(),
              resource: model,
              userId: req.userId(),
            }).markAsFinished();
          });

          await model.save({ transaction });

          if (eventCalled === false) {
            // to ensure event called
            // because sequelize ignoring event when nothing cahnged
            //@ts-ignore
            await model.constructor.runHooks(hook, model, {
              transaction,
            });
          }

          return model;
        })
        .then(() => req.findResourceOrFail())
        .then((resource) => resource.serializeForDetail(req))
        .then((resource) => res.respondUpdated(resource.attributes))
        .catch((error) => res.respondError(error));
    })
    .catch((error) => res.respondError(error));
};
