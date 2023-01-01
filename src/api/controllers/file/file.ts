import * as utils from '@utils/writer';
import * as fileService from '@service/file/fileService';
import { createRoute } from '@utils/controller-factory';

export const downloadFile = createRoute({
  async handler(req, res) {
    const bucket = req.swagger.params.bucket.value;
    const filename = req.swagger.params.filename.value;

    const response = await fileService.downloadFile(filename, bucket);
    utils.writeFile(res, {
      filename: response.filename,
      buffer: response.data,
    });
  },
});

export const uploadFile = createRoute({
  handler(req) {
    return fileService.uploadFile(
      req.swagger.params.bucket.value,
      req.files?.file,
      req.swagger.params.useV4FileName?.value ?? true,
    );
  },
});

export const getListOfObjects = createRoute({
  handler(req) {
    return fileService.getListOfObjects(req.swagger.params.bucket.value);
  },
});
