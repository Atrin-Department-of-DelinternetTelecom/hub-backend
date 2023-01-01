import * as GfContractDataInternet from '@service/intranet/GfContractDataInternetService';

import { createRoute } from '@api/utils/controller-factory';
import { writeFile } from '@utils/writer';

export const getGfContractDataInternetsId = createRoute({
  handler(req, res) {
    const id = req.swagger.params.id.value;
    return GfContractDataInternet.getGfContractDataInternetsId(id);
  },
});

export const putGfContractDataInternetsId = createRoute({
  handler(req, res) {
    const id = req.swagger.params.id.value;
    return GfContractDataInternet.putGfContractDataInternetsId(
      id,
      req.body,
      req.user,
    );
  },
});

export const downloadImage = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;
    const image = req.swagger.params.number.value;

    writeFile(res, await GfContractDataInternet.downloadImage(id, image));
  },
});

export const uploadImage = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    const image = req.swagger.params.number.value;

    return GfContractDataInternet.uploadImage(id, image, req.files?.image);
  },
});

export const cpeStatusByDataInternetId = createRoute({
  async handler(req) {
    const id = req.swagger.params.dataInternetId.value;
    const state =
      await GfContractDataInternet.checkFirstConnectionByDataInternetId(id);
    if (state === true) {
      return {
        connected: true,
      };
    }
    return {
      connected: false,
      reason: state,
    };
  },
});

export const connectRouterByDataInternetId = createRoute({
  async handler(req) {
    const id = req.swagger.params.dataInternetId.value;
    return GfContractDataInternet.connectRouterByDataInternetId(id, req.user);
  },
});
