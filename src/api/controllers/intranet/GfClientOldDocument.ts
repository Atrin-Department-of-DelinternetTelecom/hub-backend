import * as GfClientOldDocumentService from '@service/intranet/GfClientOldDocumentService';

import { createRoute } from '@utils/controller-factory';
import { writeFile } from '@utils/writer';

export const deleteGfClientDocumentsId = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    return GfClientOldDocumentService.destroyGfClientDocumentsId(id);
  },
});

export const getGfClientDocuments = createRoute({
  handler(req) {
    return GfClientOldDocumentService.getGfClientDocuments(req.query);
  },
});

export const getGfClientDocumentsId = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    return GfClientOldDocumentService.getGfClientDocumentsId(id);
  },
});

export const postGfClientDocuments = createRoute({
  handler(req) {
    const body = req.swagger.params.body.value;
    return GfClientOldDocumentService.postGfClientDocuments(body);
  },
});

export const putGfClientDocumentsId = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    return GfClientOldDocumentService.putGfClientDocumentsId(id, req.body);
  },
});

export const downloadFile = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;

    writeFile(res, await GfClientOldDocumentService.downloadFile(id));
  },
});

export const uploadFile = createRoute({
  handler(req) {
    return GfClientOldDocumentService.uploadFile(req.files?.file);
  },
});
