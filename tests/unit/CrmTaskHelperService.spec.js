'use strict';
require('../init-tests');
const { initDb } = require('../test-utils');
const moment = require('moment');
const { UnpaidInvoice, CrTask, GfClient } = require('@models').allModels;
const CrmTaskHelperService = require('src/api/service/intranet/CrmTaskHelperService');
const hbs = require('express-handlebars');
const path = require('path');
const handlebars = hbs.create({
  layoutsDir: path.resolve('@template'),
  defaultLayout: false,
});
const config = require('@config');

const cutDate = moment().startOf('M').add(2, 'week').toDate();
const common = {
  GfInvoiceInvoice: {
    id: 123456,
    uid: 90,
    serieId: 9,
    invoiceId: 56000,
    code: 'F21/0048915',
    date: new Date(),
    payDate: new Date(),
    clientId: 7585,
    clientName: 'clientName from invoiceinvoice',
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
  UnpaidInvoice: {
    id: 10,
    uid: 90,
    invoice_code: 'F21/0048915',
    invoice_id: 123456,
    client_id: 8133,
    invoice_date: new Date(),
    msg_period: 14,
    msgs_per_period: 2,
    msg_hour: moment().format('YYYY-MM-DD 12:00:00'),
    unpaid_fee: 7.5,
    template_id: 3,
    template: 'name:{name}, code:{code}, date:{date}, fee_total:{fee_total}',
    invoice_status: 'cutted',
    cut_date: cutDate,
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
  GfClient: {
    id: 8133,
    name: 'GfClient',
  },
  CrTask: [],
};

describe('saveUnpaidTaskForNotify', () => {
  it('should create type:cut task', async () => {
    const cutDate = moment().startOf('M').add(2, 'week').toDate();

    await initDb(common);

    const unpaidInvoice = await UnpaidInvoice.findByPk(10);

    const taskId = await CrmTaskHelperService.saveUnpaidTaskForNotify(
      unpaidInvoice,
      'cut',
    );

    expect(taskId).toBeTruthy();

    const task = await CrTask.findByPk(taskId);
    expect(task).toBeTruthy();
    expect(task).toMatchObject({
      id: 1,
      uid: 90,
      userId: 0,
      taskTypeId: 74,
      clientId: 7585,
      alias: 'Incidencia Impagat',
      aditionalText: await handlebars.render(
        path.resolve(config.get('index.templates'), `cut.handlebars`),
        {
          id: 10,
          code: 'F21/0048915',
          cutDate,
          total: '51.21',
        },
      ),
      emailAttachments: null,
      executed: '0',
      previsionDate: null,
      duration: null,
      refererKey: 'GfCrm',
      chatId: 'crmTask:1',
      status: 1,
    });
  });

  it('should create type:sms task', async () => {
    const cutDate = moment().startOf('M').add(2, 'week').toDate();

    await initDb({
      ...common,
      GfClient: {
        id: 8133,
        uid: 90,
        imported: null,
        active: 1,
        defaulter: 0,
        invoiceClientId: 231,
        userId: 2298,
        idTpv: '2',
        idOldWeb: 0,
        phicusCustomerId: 0,
        collaboratorId: null,
        distributorId: null,
        subscriberTypeId: 12,
        marketingConsentTypeId: null,
        documentTypeId: 10,
        fiscalId: 'X8600785G',
        nationalityCode: null,
        name: 'Mariana Gina',
        contactName: 'Mariana',
        contactFamilyName1: 'Gina',
        contactFamilyName2: 'Atanasiu',
        birthday: '1993-06-24 00:00:00',
        status: 1,
      },
    });

    const unpaidInvoice = await UnpaidInvoice.findByPk(10, {
      include: {
        model: GfClient,
        as: 'client',
      },
    });

    const additionalData = {
      phone: 'client-phone',
      sendDate: new Date(),
      via: 'sms',
    };

    const taskId = await CrmTaskHelperService.saveUnpaidTaskForNotify(
      unpaidInvoice,
      'sms',
      {
        id: 4545,
        name: 'userName',
      },
      additionalData,
    );

    expect(taskId).toBeTruthy();

    const task = await CrTask.findByPk(taskId);
    expect(task).toBeTruthy();
    expect(task).toMatchObject({
      id: 1,
      uid: 90,
      userId: 4545,
      taskTypeId: 74,
      clientId: 7585,
      alias: 'Incidencia Impagat',
      aditionalText: await handlebars.render(
        path.resolve(config.get('index.templates'), `sms.handlebars`),
        {
          id: 10,
          code: 'F21/0048915',
          cutDate,
          sendDate: additionalData.sendDate,
          phone: additionalData.phone,
          clientName: 'Mariana Gina',
          unpaidFee: '7.50',
          total: '51.21',
          userName: 'userName',
          via: additionalData.via,
        },
      ),
      emailAttachments: null,
      executed: '0',
      previsionDate: null,
      duration: null,
      refererKey: 'GfCrm',
      chatId: 'crmTask:1',
      status: 1,
    });
  });

  it('should create type:unpaid task', async () => {
    const cutDate = moment().startOf('M').add(2, 'week').toDate();

    await initDb(common);

    const unpaidInvoice = await UnpaidInvoice.findByPk(10);

    const taskId = await CrmTaskHelperService.saveUnpaidTaskForNotify(
      unpaidInvoice,
      'unpaid',
      {
        id: 4545,
        name: 'userName',
      },
    );

    expect(taskId).toBeTruthy();

    const task = await CrTask.findByPk(taskId);
    expect(task).toBeTruthy();
    expect(task).toMatchObject({
      id: 1,
      uid: 90,
      userId: 4545,
      taskTypeId: 74,
      clientId: 7585,
      alias: 'Incidencia Impagat',
      aditionalText: await handlebars.render(
        path.resolve(config.get('index.templates'), `unpaid.handlebars`),
        {
          id: 10,
          code: 'F21/0048915',
          cutDate,
          total: '51.21',
          userName: 'userName',
        },
      ),
      emailAttachments: null,
      executed: '0',
      previsionDate: null,
      duration: null,
      refererKey: 'GfCrm',
      chatId: 'crmTask:1',
      status: 1,
    });
  });
});
