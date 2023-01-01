'use strict';

import { createRoute } from '@api/utils/controller-factory';
import * as ContaPlus from '../../service/intranet/ContaplusService';
import * as utils from '@utils/writer';
import { intranet } from '@models';

const { InvoiceRemitances } = intranet;
import { errors } from '@api/http/http_errors';

export const contaplusremitance = createRoute({
  async handler(req, res) {
    const remitanceId = req.swagger.params.remitanceId.value;
    const remittance = await InvoiceRemitances.findByPk(remitanceId);
    if (!remittance)
      throw new errors.NotFound(`remittance with id ${remitanceId} not found`);

    const response = await ContaPlus.contaplusremitance(remittance);
    utils.writeFile(res, response);
  },
});

export const contaplusinvoices = createRoute({
  async handler(req, res) {
    const start = req.swagger.params.start.value;
    const end = req.swagger.params.end.value;

    const response = await ContaPlus.contaplusinvoices(start, end);
    utils.writeFile(res, response);
  },
});
