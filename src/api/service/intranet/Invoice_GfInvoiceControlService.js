'use strict';
const {
  GfInvoicePeriod,
  GfInvoiceControl,
  GfInvoiceInvoice,
  GfInvoiceControlComparative,
  GfClient,
  InvoiceClientsInvoiceProfile,
  InvoicePayment,
  transaction,
} = require('@models').intranet;

const _ = require('lodash');

const actionRunner = require('@lib/action-runner').default;

const CounterService = require('../global/CounterService');

/**
 * build control rows for clients(with from and size).this function called in controlTandas to create control row
 * @param {number} period_id related period id to build control rows
 * @param {number} from for select pagination of client: start from
 * @param {number} size size of client to build control rows in this queu
 * @param {boolean} as_comparative
 * @returns { Promise<{ success:boolean, total?: number, reason?: string }> }
 */
exports.buildPartialControls = async (
  period_id,
  from,
  size,
  as_comparative = false,
) => {
  const period = await GfInvoicePeriod.findByPk(period_id);

  // set as in_progress and select invocieControl(or Comparative)
  const invoiceControlOrComparative = as_comparative
    ? GfInvoiceControlComparative
    : GfInvoiceControl;
  if (!as_comparative) {
    period.controlRows = 'in_progress';
    await period.save();
  }

  if (!period) {
    return {
      success: false,
      reason: 'period not found',
    };
  }

  //get client with pagination(50 clients)
  const clients = await GfClient.findAll({
    where: {
      active: 1,
      noBillable: 0,
    },
    attributes: ['id', 'invoiceClientId'],
    offset: from,
    limit: size,
  });

  const clientIds = [];
  const invoiceClientIds = [];
  clients.forEach((client) => {
    clientIds.push(client.id);
    invoiceClientIds.push(client.invoiceClientId);
  });

  const profilesOfClients = {};
  (
    await InvoiceClientsInvoiceProfile.findAll({
      where: {
        clientId: invoiceClientIds,
      },
    })
  ).forEach((invoiceProfile) => {
    const clientProfiles = profilesOfClients?.[invoiceProfile.clientId] ?? [];

    clientProfiles.push(invoiceProfile);
    _.setWith(
      profilesOfClients,
      invoiceProfile.clientId,
      clientProfiles,
      Object,
    );
  });

  //get
  const availableInvoiceControlOrComparativeForClients = {};
  (
    await invoiceControlOrComparative.findAll({
      where: {
        periodId: period_id,
        clientId: clientIds,
      },
    })
  ).forEach((availableInvoiceControlOrComparativeForClient) => {
    availableInvoiceControlOrComparativeForClients[
      availableInvoiceControlOrComparativeForClient.id
    ] = availableInvoiceControlOrComparativeForClient;
  });

  await transaction(async () => {
    //generate control rows for clients
    const newInvoiceControlOrComparatives = [];
    let counter = 0;
    for (const client of clients) {
      // if control row created,then we dont need to create again
      if (availableInvoiceControlOrComparativeForClients[client.id]) {
        continue;
      }

      const newInvoiceControlOrComparative = {
        clientId: client.id,
        periodId: period_id,
        periodDate: period.period,
        invoiceProfileId: 0,
        issued: 0,
        invoiceId: 0,
        issuedNumber: '',
        emailSent: 0,
        withError: 0,
        total: 0,
        baseTotal: 0,
        taxsTotal: 0,
        emailId: 0,
        payDate: null,
        remounted: 0,
        qRemounted: 0,
        cueued: null,
        errorDescription: '',
      };

      newInvoiceControlOrComparatives.push(newInvoiceControlOrComparative);
      const profiles = profilesOfClients[client.invoiceClientId] ?? [];
      counter++;
      for (const profile of profiles) {
        const profileInvoiceControl = { ...newInvoiceControlOrComparative };
        profileInvoiceControl.invoiceProfileId = profile.id;
        newInvoiceControlOrComparatives.push(profileInvoiceControl);
      }
    }
    await CounterService.tick(
      'Invoice_GfPeriodsManager_controlRows_' + period_id,
      counter,
    );
    await invoiceControlOrComparative.bulkCreate(
      newInvoiceControlOrComparatives,
    );
  });

  return {
    success: true,
    total: clients.length,
  };
};

/**
 * update states of control based on related invoice and payment of invoice
 * @param {object|number|AnyModel} control control info
 * @param {object|number} invoice invoice info
 * @returns {Promise<{ success: boolean, control?: AnyModel, reason?: string }>}
 */
exports.consolideControl = async (control, invoice = null) => {
  if (!invoice) invoice = await GfInvoiceInvoice.findByPk(control.invoiceId);

  switch (invoice.state) {
    case 'issued':
      control.issued = 1;
      break;
    case 'canceled':
      invoice = await GfInvoiceInvoice.findByPk(invoice.invoiceId);
      control.issued = invoice.state === 'issued' ? 1 : 0;
      if (!invoice) {
        control.withError = 1;
        control.errorDescription = `No invoice linked, canceled\n${control.errorDescription}`;
        return {
          success: false,
        };
      }
      break;
  }

  //select one payment and remove other payments
  const [payment, ...otherPayments] = await InvoicePayment.findAll({
    where: {
      invoiceId: invoice.id,
    },
  });

  await InvoicePayment.update(
    { status: 0 },
    { where: { id: otherPayments.map((payment) => payment.id) } },
  );

  // sync invoice and related payment(find dif and update each other by their states)
  let dif = false;
  if (
    payment &&
    (payment.dueDate !== invoice.payDate ||
      payment.paymentType !== invoice.paymentType)
  ) {
    dif = true;
  }
  let paymentSouldUpdate = false;
  let invoiceSouldUpdate = false;
  if (payment && dif && invoice.state !== 'proforma') {
    invoice.payDate = payment.dueDate;
    invoice.paymentType = payment.paymentType;
    invoiceSouldUpdate = true;
  } else if (payment) {
    payment.payDate = invoice.dueDate;
    payment.paymentType = invoice.paymentType;
    paymentSouldUpdate = true;
  }

  if (payment && payment.quantity !== invoice.total) {
    payment.quantity = invoice.total;
    paymentSouldUpdate = true;
  }

  if (invoiceSouldUpdate) await invoice.save();
  if (payment && paymentSouldUpdate) await payment.save();

  // save result of invoice in related control rows
  control.invoiceId = invoice.id;
  control.withError = 0;
  control.issuedNumber = invoice.code;
  control.total = invoice.total;
  control.baseTotal = invoice.baseTotal;
  control.taxsTotal = invoice.taxesTotal;
  control.payDate = invoice.payDate;
  return {
    success: true,
    control,
  };
};

/**
 * update states of control based on related invoice and payment of invoice
 * @param {object|number|AnyModel} control control info
 * @param {object} invoice invoice info
 * @param {object[]} payments payments of invoice
 * @returns {Promise<{  control: AnyModel, invoice: AnyModel }>}
 */
exports.consolideControlInAutomaticInvoice = async (
  control,
  invoice,
  payments = [],
) => {
  switch (invoice.state) {
    case 'issued':
      control.issued = 1;
      break;
    case 'canceled':
      invoice = await GfInvoiceInvoice.findByPk(invoice.invoiceId);
      control.issued = invoice.state === 'issued' ? 1 : 0;
      if (!invoice)
        throw Error(`No invoice linked, canceled\n${control.errorDescription}`);

      break;
  }

  const payment = payments[0];

  // sync invoice and related payment(find dif and update each other by their states)
  let dif = false;
  if (
    payment &&
    (payment.dueDate !== invoice.payDate ||
      payment.paymentType !== invoice.paymentType)
  ) {
    dif = true;
  }

  if (payment && dif && invoice.state !== 'proforma') {
    invoice.payDate = payment.dueDate;
    invoice.paymentType = payment.paymentType;
  } else if (payment) {
    payment.payDate = invoice.dueDate;
    payment.paymentType = invoice.paymentType;
  }

  if (payment && payment.quantity !== invoice.total)
    payment.quantity = invoice.total;

  // save result of invoice in related control rows
  control.invoiceId = invoice.id;
  control.withError = 0;
  control.issuedNumber = invoice.code;
  control.total = invoice.total;
  control.baseTotal = invoice.baseTotal;
  control.taxsTotal = invoice.taxesTotal;
  control.payDate = invoice.payDate;
  return {
    control,
    invoice,
  };
};

/**
 * build queues for create controll rows per valid clients
 * @param {object} period control rows related to which period
 * @param {number} creator_id who call this api
 * @param {boolean} as_comparative is comparative or no
 * @returns {Promise<{ success: boolean }>}
 */
exports.buildControlTandas = async (
  period,
  creator_id,
  as_comparative = false,
) => {
  const availableClients = await GfClient.count({
    where: {
      active: 1,
      noBillable: 0,
    },
  });

  if (!as_comparative) {
    period.controlRows = 'in_progress';
    await period.save();
  }

  // split all clients in groups with size 50 and send each one to a queue
  const tandas = Math.ceil(availableClients / 50);
  const actions = [];
  const as_comp = as_comparative ? 'comp_' : '';
  await CounterService.create(
    `Invoice_GfPeriodsManager_controlRows_${as_comp}${period.id}`,
    {
      max: availableClients,
      model_id: period.id,
      model_name: 'gf_invoice_periods',
    },
  );

  await CounterService.create(
    `Invoice_GfPeriodsManager_controlRowsTanda_${as_comp}${period.id}`,
    {
      max: tandas,
      model_id: period.id,
      model_name: 'gf_invoice_periods',
    },
  );

  for (let n = 0; n < tandas; n++) {
    const from = n * 50;
    actions.push({
      name: 'build-control',
      params: {
        periodId: period.id,
        from,
        size: 50,
        n,
        tandas,
        totalClients: availableClients,
        asComparative: as_comparative,
      },
    });
  }

  await actionRunner.createBulk(
    {
      creator_id,
      name: 'build-control',
      model_name: 'gf_invoice_periods:build-control',
      model_id: period.id,
      params: {
        fetchActions: 200,
      },
    },
    actions,
  );

  return {
    success: true,
  };
};

/**
 *
 * @param {object} period
 * @param {string} phase
 */
exports.clearErrors = async (period, phase) => {
  const field = {
    invoiced: 'cueued',
    issued: 'cueuedIssued',
    email: 'cueuedEmail',
  }[phase];

  const updateControl = {
    errorDescription: '',
    withError: 0,
    errorPhase: null,
    [field]: 'waiting',
  };

  await GfInvoiceControl.update(updateControl, {
    where: {
      periodId: period.id,
      errorPhase: phase,
      withError: 1,
    },
  });
};
