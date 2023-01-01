import * as Service from '@service/global/TemporaryLink';
import { createRoute } from '@utils/controller-factory';
import { respondSuccess } from '@utils/response';
import { getUrl } from '@utils/url';

export const create = createRoute({
  async handler(req) {
    const { pathname } = req.body;

    const token = await Service.create({
      pathname,
      ttl: 15 * 1000,
    });

    const url = getUrl(req);
    url.pathname = pathname;
    url.searchParams.set('tmp', token);

    return respondSuccess({ token, url: url.toString() });
  },
});
