//@ts-check
'use strict';
const { getMonths } = require('src/api/utils/dates.js');
const moment = require('moment');

describe.skip('dates.getMonths test', () => {
  it('should work', async () => {
    const result = await getMonths(moment('2020-01-01'), moment('2021-01-31'));
    expect(result).toEqual({
      202001: {
        init: '2020-01-01 12:00:00',
        end: '2020-01-31 12:00:59',
        daysInMonth: 31,
      },
      202002: {
        init: '2020-02-01 12:00:00',
        end: '2020-02-29 12:00:59',
        daysInMonth: 29,
      },
      202003: {
        init: '2020-03-01 12:00:00',
        end: '2020-03-31 01:00:59',
        daysInMonth: 31,
      },
      202004: {
        init: '2020-04-01 01:00:00',
        end: '2020-04-30 01:00:59',
        daysInMonth: 30,
      },
      202005: {
        init: '2020-05-01 01:00:00',
        end: '2020-05-31 01:00:59',
        daysInMonth: 31,
      },
      202006: {
        init: '2020-06-01 01:00:00',
        end: '2020-06-30 01:00:59',
        daysInMonth: 30,
      },
      202007: {
        init: '2020-07-01 01:00:00',
        end: '2020-07-31 01:00:59',
        daysInMonth: 31,
      },
      202008: {
        init: '2020-08-01 01:00:00',
        end: '2020-08-31 01:00:59',
        daysInMonth: 31,
      },
      202009: {
        init: '2020-09-01 01:00:00',
        end: '2020-09-30 01:00:59',
        daysInMonth: 30,
      },
      202010: {
        init: '2020-10-01 01:00:00',
        end: '2020-10-31 01:00:59',
        daysInMonth: 31,
      },
      202011: {
        init: '2020-11-01 01:00:00',
        end: '2020-11-30 01:00:59',
        daysInMonth: 30,
      },
      202012: {
        init: '2020-12-01 01:00:00',
        end: '2020-12-31 01:00:59',
        daysInMonth: 31,
      },
      202101: {
        init: '2021-01-01 01:00:00',
        end: '2021-01-30 01:00:59',
        daysInMonth: 31,
      },
    });
  });
});
