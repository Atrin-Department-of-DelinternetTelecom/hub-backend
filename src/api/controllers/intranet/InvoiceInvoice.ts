'use strict';

import * as utils from '@utils/writer';
import * as InvoiceInvoice from '@service/intranet/InvoiceInvoiceService';
import InvoiceReportGfAbstract from '@service/intranet/InvoiceReportGfAbstractService';
import * as InvoiceView from '@service/intranet/InvoiceView';
import { createRoute } from '@api/utils/controller-factory';

export const getInvoiceInvoicesCode = createRoute({
  handler(req) {
    const code = req.swagger.params.code.value;
    return InvoiceInvoice.getInvoiceInvoicesCode(code);
  },
});

export const deleteInvoiceInvoicesId = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    return InvoiceInvoice.deleteInvoiceInvoicesId(id);
  },
});

export const getInvoiceInvoices = createRoute({
  handler(req) {
    return InvoiceInvoice.getInvoiceInvoices(req.query);
  },
});

export const getInvoiceInvoicesId = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    return InvoiceInvoice.getInvoiceInvoicesId(id);
  },
});

export const getRelatedInvoice = createRoute({
  handler(req) {
    const id = req.swagger.params.id.value;
    return InvoiceInvoice.getRelatedInvoice(id);
  },
});

export const postInvoiceInvoices = createRoute({
  handler(req) {
    const body = req.swagger.params.body.value;
    const userId = req.user.userId;
    return InvoiceInvoice.postInvoiceInvoices(body, userId);
  },
});

export const putInvoiceInvoicesId = createRoute({
  handler(req) {
    const body = req.swagger.params.body.value;
    const id = req.swagger.params.id.value;
    return InvoiceInvoice.putInvoiceInvoicesId(id, body);
  },
});

export const getFrontNextMonthAbstract = createRoute({
  handler(req) {
    const clientId = req.swagger.params.clientId.value;
    return InvoiceReportGfAbstract.getFrontNextMonthAbstract(
      clientId,
      req.user.userId,
    );
  },
});

export const downloadFullInvoice = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;

    const result = await InvoiceView.downloadInvoice(id, {
      attachExtraInfo: true,
    });

    utils.writeFile(res, {
      filename: result.filename,
      buffer: result.file,
    });
  },
});

export const downloadFullInvoiceHtml = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;

    const { html } = await InvoiceView.renderInvoiceHtml(id, {
      attachExtraInfo: true,
    });

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.send(html);
  },
});

export const downloadSummaryInvoice = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;

    const result = await InvoiceView.downloadInvoice(id, {
      attachExtraInfo: false,
    });

    utils.writeFile(res, {
      filename: result.filename,
      buffer: result.file,
    });
  },
});

export const downloadSummaryInvoiceHtml = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;

    const { html } = await InvoiceView.renderInvoiceHtml(id, {
      attachExtraInfo: false,
    });

    res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    res.send(html);
  },
});

export const changeState = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const state = req.swagger.params.state.value;
    const duplicated =
      req.swagger.params.duplicated.value === 'true' ? true : false;

    return InvoiceInvoice.changeState(id, state, req.user.userId, duplicated);
  },
});

export const duplicateInvoice = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    return InvoiceInvoice.duplicateInvoice(id, req.user.userId);
  },
});

export const previewInvoiceId = createRoute({
  async handler(req) {
    const id = req.swagger.params.id.value;
    const page = req.swagger.params.page?.value;
    const page_size = req.swagger.params.page_size?.value;
    return InvoiceView.previewInvoiceId(id, { page, page_size });
  },
});

export const convertInvoicesToXML = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;
    const result = await InvoiceInvoice.convertInvoicesToXML([id]);

    utils.writeFile(res, {
      buffer: result.data,
      filename: result.filename,
    });
  },
});

export const setAsPaidForNonRemittance = createRoute({
  async handler(req, res) {
    const id = req.swagger.params.id.value;
    return InvoiceInvoice.setAsPaidForNonRemittance(id, req.user.userId);
  },
});

export const tmpFixContracts = createRoute({
  async handler(req, res) {
    return InvoiceInvoice.tmpFixContracts(req.user.userId);
  },
});

export const tmpFixInvalidInvoiceCodes = createRoute({
  async handler(req, res) {
    return InvoiceInvoice.tmpFixInvalidInvoiceCodes();
  },
});
