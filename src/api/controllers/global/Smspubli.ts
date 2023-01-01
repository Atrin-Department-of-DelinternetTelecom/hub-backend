import { createRoute } from '@api/utils/controller-factory';
import * as SmspubliService from '@service/global/SmspubliService';

export const insert = createRoute({
  async handler(req) {
    return SmspubliService.insert(req.body);
  },
});
