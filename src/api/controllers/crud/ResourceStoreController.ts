import { ActionEvent } from '@api/models/crud/crud_action_event';
import { AnyModel } from '@api/models';
import Field from '@lib/crud/Field';
import { ResourceRequest } from './Request';
import { ResourceResponse } from './Response';

export const create = function (req: ResourceRequest, res: ResourceResponse) {
  const resource = req.resource();
  const model = resource.newModel() as AnyModel;

  model.sequelize
    .transaction(async (transaction) => {
      // Throw exception if user can not create new resource
      resource.authorizeToCreate(req);
      // Throw exception if request has invalid data
      await resource.validateForCreation(req);
      const fields = resource
        .fieldCollection(req)
        .forCreation()
        .authorize(req, model)
        .all() as Array<Field>;

      // fill model attribute
      const callbacks = fields.map((field) => field.fill(req, model));

      // call event before save model
      await resource.creating(req, model);
      await resource.saving(req, model);

      const [hook, hookName] = ['afterCreate', 'resourceCreated'];
      //@ts-ignore
      model.constructor.addHook(hook, hookName, async (model, options) => {
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
        await resource.created(req, model);
        await resource.saved(req, model);

        await ActionEvent.forResourceCreate({
          resource: model,
          payload: req.all(),
          userId: req.userId(),
        }).markAsFinished();
      });

      await model.save({ transaction });

      return model;
    })
    .then((model) => req.findResourceOrFail(model.id))
    .then((resource) => resource.serializeForDetail(req))
    .then((resource) => res.respondCreated(resource.attributes))
    .catch((error) => res.respondError(error));
};
