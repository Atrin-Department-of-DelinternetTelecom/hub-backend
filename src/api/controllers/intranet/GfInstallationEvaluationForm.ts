import * as GfInstallationEvaluationForm from '@service/intranet/GfInstallationEvaluationFormService';

import { createRoute } from '@api/utils/controller-factory';
import { writeFile } from '@api/utils/writer';

export const deleteGfInstallationEvaluationFormsId = createRoute({
  async handler(req, res) {
    return GfInstallationEvaluationForm.deleteGfInstallationEvaluationFormsId(
      req.swagger.params.id.value,
    );
  },
});

export const getGfInstallationEvaluationForms = createRoute({
  async handler(req, res) {
    return GfInstallationEvaluationForm.getGfInstallationEvaluationForms({
      ...req.query,
      url:
        req.protocol +
        '://' +
        req.get('host') +
        req.url.slice(0, req.url.indexOf('?')),
    });
  },
});

export const getGfInstallationEvaluationFormsId = createRoute({
  async handler(req, res) {
    return GfInstallationEvaluationForm.getGfInstallationEvaluationFormsId(
      req.swagger.params.id.value,
    );
  },
});

export const postGfInstallationEvaluationForms = createRoute({
  async handler(req, res) {
    return GfInstallationEvaluationForm.postGfInstallationEvaluationForms(
      req.body,
    );
  },
});

export const putGfInstallationEvaluationFormsId = createRoute({
  async handler(req, res) {
    return GfInstallationEvaluationForm.putGfInstallationEvaluationFormsId(
      req.swagger.params.id.value,
      req.body,
    );
  },
});

export const downloadImage = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;

    writeFile(res, await GfInstallationEvaluationForm.downloadSignature(id));
  },
});

export const uploadImage = createRoute({
  handler(req) {
    return GfInstallationEvaluationForm.uploadSignature(req.files?.file);
  },
});
