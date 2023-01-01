import { AnyModel } from '@api/models';
import { getTransporter, senders } from '@lib/mailer';
import ejs from 'ejs';
import path from 'path';
import { get as config } from '@config';
import assert from 'assert';
import jwt from 'jsonwebtoken';
import { GfInvoiceInvoice } from '@api/models/intranet/intranet_invoice_invoice';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import to from 'await-to-js';

const templates = config('index.templates') as string;
const clubAddress = config('index.club.endpoint') as string;
const clubSecretKey = config('index.club.secretKey') as string;

export const mailInvoiceBy = async (invoiceControl: AnyModel) => {
  const invoice = invoiceControl.invoice;
  const client = invoiceControl.invoice.client;
  const period = invoiceControl.period;

  if (!isValidEmail(client.emailAddress)) throw new Error('invalid email');

  await getTransporter().sendMail({
    from: senders.invoice,
    to: client.emailAddress,
    subject: period.emailSubject,
    html: await generateHtmlBy(invoice),
  });
};

export const sendEmailByInvoiceId = async (invoiceIds: number[]) => {
  const invoices = await GfInvoiceInvoice.findAll({
    where: { id: invoiceIds },
    include: [{ model: GfClient, as: 'client' }],
  });

  const sentStatuses: { invoiceId: number; sent: boolean }[] = [];

  for (const invoice of invoices) {
    if (!isValidEmail(invoice.client.emailAddress))
      throw new Error('invalid email');

    const sendStatus = { invoiceId: invoice.id, sent: true };

    const [error] = await to(
      getTransporter().sendMail({
        from: senders.invoice,
        to: invoice.client.emailAddress,
        subject: `Factura`,
        html: await generateHtmlBy(invoice),
      }),
    );

    if (error) sendStatus.sent = false;

    sentStatuses.push(sendStatus);
  }

  return sentStatuses;
};

const generateHtmlBy = async (invoice: AnyModel) => {
  return ejs.renderFile(path.resolve(templates, './email/newInvoice.ejs'), {
    total: invoice.total,
    clientName: invoice.clientName,
    link: await generateViewClubLinkBy(invoice),
  });
};

const generateViewClubLinkBy = async (invoice: AnyModel) => {
  assert(clubAddress, 'Missing club.endpoint in env');
  const clubInvoicingAddress = `${new URL(clubAddress).origin}/invoice`;
  const clubInvoicingURL = new URL(clubInvoicingAddress);
  clubInvoicingURL.searchParams.set('token', await generateTokenBy(invoice));
  return clubInvoicingURL.toString();
};

const generateTokenBy = async (invoice: AnyModel) => {
  assert(clubSecretKey, 'Missing club.secretKey in env');

  const clientId = invoice.clientId;
  const invoiceId = invoice.id;
  const payload = {
    type: 'view-invoice',
    clientId,
    invoiceId,
  };

  const token = jwt.sign(payload, clubSecretKey, {
    expiresIn: '30d',
  });

  return token;
};

//if we have other email validation function, this function must remove
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
};
