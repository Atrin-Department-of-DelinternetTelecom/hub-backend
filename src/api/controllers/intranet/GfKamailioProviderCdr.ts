'use strict';

import GfKamailioProviderCdr from '@service/intranet/GfKamailioProviderCdrService';
import { createRoute } from '@utils/controller-factory';
import { isResponsePayload } from '@utils/response';
import * as utils from '@utils/writer';

export const deleteGfKamailioProviderCdrsId = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    return GfKamailioProviderCdr.deleteGfKamailioProviderCdrsId(id);
  },
});

export const getGfKamailioProviderCdrs = createRoute({
  handler(req) {
    return GfKamailioProviderCdr.getGfKamailioProviderCdrs(req.query);
  },
});

export const getGfKamailioProviderCdrsId = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    return GfKamailioProviderCdr.getGfKamailioProviderCdrsId(id);
  },
});

export const postGfKamailioProviderCdrs = createRoute({
  handler(req) {
    const body = req.swagger.params.body.value;
    return GfKamailioProviderCdr.postGfKamailioProviderCdrs(body);
  },
});

export const putGfKamailioProviderCdrsId = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    const body = req.swagger.params.body.value;
    return GfKamailioProviderCdr.putGfKamailioProviderCdrsId(id, body);
  },
});

export const parseGfKamailioProviderCdrsId = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    return GfKamailioProviderCdr.parseGfKamailioProviderCdrsId(id, req.user.id);
  },
});

export const createGfKamailioProviderCdrFromOperadors = createRoute({
  handler(req, res) {
    const body = req.swagger.params.body.value;
    return GfKamailioProviderCdr.createGfKamailioProviderCdrFromOperadors(body);
  },
});
