import { createRoute } from '@api/utils/controller-factory';
import * as GrantPermissionService from '@service/hrms/GrantPermissionService';

export const getAllForClientId = createRoute({
  async handler(req) {
    const clientId = req.swagger.params.clientId.value;

    return GrantPermissionService.getAllForClientId(clientId);
  },
});

export const create = createRoute({
  async handler(req) {
    return GrantPermissionService.create(req.body, req.user.id);
  },
});

export const put = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;

    return GrantPermissionService.put(id, req.body);
  },
});
