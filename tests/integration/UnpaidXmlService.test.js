'use strict';

require('../init-tests');
const { initDb } = require('../test-utils');
const moment = require('moment');
const { UnpaidInvoice, UnpaidXml, UnpaidNotification, GfInvoiceInvoice } =
  require('@models').allModels;
const _ = require('lodash');
const path = require('path');
const fs = require('fs');

jest.setTimeout(100000000);

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
const {
  postUnpaidXmls,
} = require('../../src/api/service/unpaid/UnpaidXmlService');

const xmlFile = fs.readFileSync(
  path.join(__dirname, '../files/unpaid2.xml'),
  'utf8',
);

describe('postUnpaidXmls test', () => {
  it('should work', async () => {
    const intranetInvoiceId = 123456;
    const invoice_date = moment().startOf('day').toDate();
    const msg_hour = moment().startOf('day').add(5, 'hour').toDate();

    const template =
      'name:{name} total:{total} code:{code} unpaidFee:{unpaidFee} fee_total:{fee_total} date:{date}';

    await initDb({
      UnpaidInvoice: [],
      UnpaidNotification: [],
      UnpaidXml: [],
      GfClient: {
        id: 123,
        uid: 90,
        invoiceClientId: 7585,
        active: 1,
        userId: 15,
        name: 'Cliente',
        contactPhone: '+32478552152',
      },
      UnpaidBank: {
        id: 7,
        name: 'test',
        iban: 'test',
        bic: 'test bic',
        bic_name: 'test bic anme',
      },
      GfInvoiceInvoice: {
        id: intranetInvoiceId,
        uid: 90,
        serieId: 9,
        invoiceId: 56000,
        code: 'F18/00004',
        date: invoice_date,
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

    const gfInvoice = await GfInvoiceInvoice.findByPk(intranetInvoiceId);
    expect(gfInvoice).toMatchObject({
      date: invoice_date,
    });

    const {
      payload: { data },
    } = await postUnpaidXmls(
      {
        auto_execute: true,
        msg_hour: msg_hour.toISOString(),
        msg_period: 14,
        msgs_per_period: 2,
        send_method: 'telegram',
        message_template: template,
        template,
        template_id: 10,
        unpaid_fee: 7.5,
      },
      xmlFile,
      {
        data: Buffer.from(xmlFile),
        encoding: '7bit',
        md5: '0216c35d5901c6cec4cba50239aa947e',
        mimetype: 'text/xml',
        name: 'xml-document-1649752187230.xml',
        size: 2584,
        tempFilePath: '',
        truncated: false,
        mv: jest.fn(),
      },
      {
        id: 1,
      },
    );

    const unpaidXml = await UnpaidXml.findByPk(data.id);

    expect(unpaidXml).toMatchObject({
      auto_execute: true,
      executed: false,
      template_id: 10,
      send_method: 'telegram',
      message_template: template,
      invoice_id: null,
      msg_period: 14,
      msgs_per_period: 2,
      msg_hour: msg_hour,
      xml_file: ' ', // WTF?
      unpaid_fee: '7.50',
      start_sending_time: null,
      description: null,
      total_invoices: 1,
      status: null, // WTF?
      deletedAt: null,
      uid: null, // WTF?
    });

    const unpaidInvoices = await UnpaidInvoice.findAll();
    expect(unpaidInvoices.length).toBe(1);
    const unpaidInvoice = unpaidInvoices[0];

    expect(unpaidInvoice).toMatchObject({
      invoice_code: 'F18/00004',
      invoice_id: intranetInvoiceId,
      client_id: 123,
      exception: null,
      invoice_date,
      msg_period: 14,
      msgs_per_period: 2,
      msg_hour: msg_hour,
      unpaid_fee: '7.50',
      xml_id: unpaidXml.id,
      template_id: 10,
      template,
      invoice_status: 'unpaid',
      send_method: 'telegram',
      cut_date: new Date(
        moment()
          .startOf('day')
          .add(14, 'day')
          .add(5, 'hour')
          .format('YYYY-MM-DD HH:mm:ss'),
      ),
      user_id: 1,
      event_id: 1,
      fallback_sms_counter: 0, // WHY?
      status: 1,
      uid: 90,
    });

    const unpaidNotifs = await UnpaidNotification.findAll();
    expect(unpaidNotifs.length).toBe(2);

    const commonUnpaidNotif = {
      invoice_id: unpaidInvoice.id,
      client_id: 123,
      send_status: 'pending',
      to: JSON.stringify({
        id: 123,
        number: '32478552152',
      }),
      message: `name:clientName total:51.21 code:F18/00004 unpaidFee:7.5 fee_total:58.71 date:${unpaidInvoice.cut_date}`,

      created_by_retry: false,
      status: 1,
      uid: 90,
    };

    expect(unpaidNotifs[0]).toMatchObject(commonUnpaidNotif);
    expect(unpaidNotifs[1]).toMatchObject(commonUnpaidNotif);

    expect(unpaidNotifs[0]).toMatchObject({
      send_date: new Date(
        moment()
          .startOf('day')
          .add(1, 'day')
          .add(5, 'hour')
          .format('YYYY-MM-DD HH:mm:ss'),
      ),
    });

    expect(unpaidNotifs[1]).toMatchObject({
      send_date: new Date(
        moment()
          .startOf('day')
          .add(7, 'day')
          .add(5, 'hour')
          .format('YYYY-MM-DD HH:mm:ss'),
      ),
    });
  });
});
