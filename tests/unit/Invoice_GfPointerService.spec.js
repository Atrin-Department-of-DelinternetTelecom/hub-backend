'use strict';

require('../init-tests');
const moment = require('moment');
const {
  getPeriodPointer,
} = require('src/api/service/intranet/Invoice_GfPointerService');

require('src/api/service/intranet/ConfigService')._mockGet(async (app, key) => {
  if (app === 'goufone' && key === 'invoiceDay') {
    return 3;
  }

  return null;
});

afterEach(async () => {
  // clean up the mess after test
});

describe('Invoice_GfPointerService.getPeriodPointer tests', () => {
  it('should work', async () => {
    const contract = {
      id: 7,
      invoiceMonths: 12,
      payDay: 4,
    };

    const result = await getPeriodPointer(contract);
    expect(result?.period).toBeTruthy();
    result.period.initDate = result.period.initDate.format('YYYY-MM-DD');
    result.period.endDate = result.period.endDate.format('YYYY-MM-DD');
    result.period.emitionDate = result.period.emitionDate.format('YYYY-MM-DD');
    result.period.payDate = result.period.payDate.format('YYYY-MM-DD');

    expect(result).toEqual({
      success: true,
      period: {
        initDate: moment().startOf('year').format('YYYY-MM-DD'),
        endDate: moment().endOf('year').format('YYYY-MM-DD'),
        emitionDate: moment()
          .startOf('year')
          .add(1, 'year')
          .format('YYYY-MM-DD'),
        payDate: moment()
          .startOf('year')
          .add(1, 'year')
          .set('day', 3)
          .format('YYYY-MM-DD'),
        isRecursive: false,
      },
      contract: { id: 7, invoiceMonths: 12, payDay: 4 },
    });
  });
});
