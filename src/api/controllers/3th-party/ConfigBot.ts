import { configureAntena } from '@api/service/3th-party/ConfigBot';
import { createRoute } from '@api/utils/controller-factory';

export const configure = createRoute({
  async handler(req, res) {
    await configureAntena(req.swagger.params.body.value);
    res.status(204);
  },
});
