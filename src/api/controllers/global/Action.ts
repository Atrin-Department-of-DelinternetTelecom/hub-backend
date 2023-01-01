import * as Service from '@service/global/ActionService';
import { createRoute } from '@utils/controller-factory';

export const getBulks = createRoute({
  async handler(req) {
    return Service.getBulks(req.query);
  },
});

export const getBulkById = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    return Service.getBulkById(id);
  },
});

export const getBulkActions = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    return Service.getBulkActions(id, req.query);
  },
});

export const rerunAction = createRoute({
  async handler(req) {
    const id = req.swagger.params.actionId.value;
    return Service.rerunAction(id);
  },
});

export const changeBulkStatus = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    return Service.changeBulkStatus(parseInt(id), req.body);
  },
});
