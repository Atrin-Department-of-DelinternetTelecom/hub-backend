import * as DocumentService from '@service/documents/DocumentService';
import { createRoute } from '@utils/controller-factory';
import {
  respondBadRequest,
  respondNotFound,
  respondOK,
  respondSuccess,
} from '@utils/response';
import * as utils from '@utils/writer';
import { URL } from 'url';

export const getDocumentId = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    return DocumentService.getDocumentId(id);
  },
});

export const getPdf = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;
    const result = await DocumentService.getPdf(id);
    if (!result) {
      return respondNotFound('not found');
    }

    utils.writeFile(res, {
      filename: result.fileName,
      buffer: result.pdf,
    });
  },
});

export const getHtml = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;

    const result = await DocumentService.getHtml(id);
    if (!result) {
      return respondNotFound('not found');
    }

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.send(result);
  },
});

export const getImages = createRoute({
  async handler(req) {
    const url = new URL(req.protocol + '://' + req.get('host'));
    const id = req.swagger.params.id.value;
    const result = await DocumentService.getImages(id, url);
    return respondSuccess(result);
  },
});

export const getImage = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;
    const page = req.swagger.params.page.value;
    const result = await DocumentService.getImage(id, page);
    if (!result) {
      return respondNotFound('not found');
    }

    utils.writeFile(res, {
      filename: result.fileName,
      buffer: result.image,
    });
  },
});

export const getThumbnail = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;
    const result = await DocumentService.getThumbnail(id);
    if (!result) {
      return respondNotFound('not found');
    }

    utils.writeFile(res, {
      filename: result.fileName,
      buffer: result.thumbnail,
    });
  },
});

export const uploadSignature = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const name = req.swagger.params.name.value ?? 'default';
    const userId = req.user.userId;
    const signature = req.files?.signature;

    if (
      !['image/png', 'image/jpg', 'image/jpeg'].includes(signature.mimetype)
    ) {
      return respondBadRequest('bad mime type');
    }

    await DocumentService.uploadSignatures(
      id,
      { [name]: signature.data },
      userId,
    );
    return respondOK('document signed');
  },
});

export const downloadSignature = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;
    const signatureName = req.swagger.params.signatureName.value ?? 'default';

    const signature = await DocumentService.loadDocumentSignature(
      id,
      signatureName,
    );
    if (!signature) {
      return respondNotFound('signatures not found');
    }

    utils.writeFile(res, {
      filename: `${id}-${signatureName}.png`,
      buffer: signature,
    });
  },
});

export const uploadSignatures = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const userId = req.user.userId;
    const files = req.body as { mimetype: string; data: string }[];

    const signs: Record<string, Buffer> = {};
    for (const [_name, sign] of Object.entries(files ?? {})) {
      if (!['image/png', 'image/jpg', 'image/jpeg'].includes(sign.mimetype)) {
        return respondBadRequest('bad mime type');
      }

      // rename legacy 'signature' key to 'default';
      const name = _name === 'signature' ? 'default' : _name;
      signs[name] = Buffer.from(sign.data, 'base64');
    }

    await DocumentService.uploadSignatures(id, signs, userId, {
      uploadToAire: false,
    });
    return respondOK('document signed');
  },
});

export const setSigned = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    await DocumentService.setSigned(id);

    return respondOK('document signed');
  },
});

export const setUnSigned = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    await DocumentService.setUnSigned(id);

    return respondOK('document unsigned');
  },
});

export const getDocsForOpero = createRoute({
  async handler(req) {
    const gfClientId = req.swagger.params.gfClientId.value;
    const gfContractId = req.swagger.params.gfContractId.value;
    return DocumentService.getDocsForOpero(gfClientId, gfContractId);
  },
});
