import { createRoute } from '@api/utils/controller-factory';
import * as ReportService from '@service/intranet/ReportService';
import * as utils from '@utils/writer';

export const csvFileOfPeriod = createRoute({
  async handler(req, res) {
    const periodId = req.swagger.params.periodId.value;
    const buffer = await ReportService.csvFileOfPeriod(periodId);
    utils.writeFile(res, {
      filename: 'report.JSON',
      buffer,
    });
  },
});
