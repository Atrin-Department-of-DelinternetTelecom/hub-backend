'use strict';
require('../init-tests');
const { initDb } = require('../test-utils');
const moment = require('moment');
const { UnpaidInvoice } = require('@models').allModels;
const _ = require('lodash');

const {
  cutLast60DaysUnpaidInvoice,
} = require('../../src/api/service/unpaid/UnpaidContractService');

const sampleUnpaidInvoice = (override = {}) => ({
  id: _.random(10, 1000),
  invoice_code: _.random(10, 1000).toString(),
  invoice_id: _.random(10, 1000),
  client_id: _.random(10, 1000),
  invoice_date: moment(),
  msg_period: 14,
  msgs_per_period: 2,
  msg_hour: '2021-08-30T00:30:00.000Z',
  unpaid_fee: '7.50',
  xml_id: _.random(10, 1000),
  template_id: _.random(10, 1000),
  template: 'name:{name} fee_total:{fee_total} date:{date} code:{code}',
  invoice_status: 'unpaid',
  fallback_sms_counter: 1,
  send_method: 'sms',
  cut_date: moment(),
  user_id: 4,
  uid: 90,
  status: 1,
  ...override,
});

describe('cutLast60DaysUnpaidInvoice test', () => {
  it('should work', async () => {
    await initDb({
      UnpaidInvoice: [
        sampleUnpaidInvoice({
          id: 2202,
          invoice_id: 123456,
          invoice_status: 'unpaid',
          cut_date: moment().subtract(2, 'day'),
        }),
        sampleUnpaidInvoice({
          id: 2203,
          invoice_status: 'unpaid',
          cut_date: moment().add(2, 'day'),
        }),
      ],
      UnpaidNotification: {
        id: 5516,
        invoice_id: 2202,
        client_id: 2979,
        task_id: null,
        send_method: 'sms',
        send_status: 'sent',
        to: '{"id":8714,"number":"636399526"}',
        message: 'test',
        sent_date: null,
        send_date: '2022-04-20T00:00:00.000Z',
        created_by_retry: false,
        user_id: null,
        uid: 90,
        status: 1,
      },
      GfInvoiceInvoice: {
        id: 123456,
        uid: 90,
        serieId: 9,
        invoiceId: 56000,
        code: 'F21/0048915',
        date: new Date(),
        payDate: new Date(),
        clientId: 7585,
        clientName: 'clientName',
        clientNif: 'clientNif',
        clientAddress: 'clientAddress',
        clientCity: 'clientCity',
        clientPostalCode: '43580',
        clientState: 'clientState',
        clientCountryIso: 'ES',
        total: 51.21,
        baseTotal: 42.32,
        userId: 2302,
        state: 'issued',
        status: 1,
      },
      CrTaskType: {
        id: 74,
        uid: 90,
        tag: '27',
        name: 'Incidencia Impagat',
        executable: 1,
        rTaskFluxId: 0,
        forcePrevisionInFuture: null,
        color: 'rgb(239, 10, 10)',
        icon: 'fa fa-usd',
        leftRight: 'left',
        excludedApps: null,
        onlyApps: null,
        hiddedOnCombo: null,
        status: 1,
      },
      CrTask: [],
    });

    await cutLast60DaysUnpaidInvoice();

    expect(await UnpaidInvoice.findByPk(2202)).toMatchObject({
      invoice_status: 'cutted',
    });

    expect(await UnpaidInvoice.findByPk(2203)).toMatchObject({
      invoice_status: 'unpaid',
    });
  });
});
