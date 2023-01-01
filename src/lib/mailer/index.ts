import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';
import { URL } from 'url';

const { SMTP_URI, HUB_SMTP_FROM, INVOICE_SMTP_FROM } = process.env;

export const senders = {
  default: HUB_SMTP_FROM,
  invoice: INVOICE_SMTP_FROM,
} as const;

export const isEnable = !!SMTP_URI && !!HUB_SMTP_FROM && !!INVOICE_SMTP_FROM;

if (!isEnable) {
  console.warn('Mail service is not enabled because of missing env variables');
}

let transporter: nodemailer.Transporter | null = null;
if (isEnable) {
  const url = new URL(SMTP_URI!);

  transporter = nodemailer.createTransport({
    host: url.hostname,
    port: parseInt(url.port),
    secure: url.protocol === 'smtps:',
    auth: {
      user: decodeURIComponent(url.username),
      pass: decodeURIComponent(url.password),
    },
    tls: { rejectUnauthorized: false },
  });
  transporter.use(
    'compile',
    hbs({
      viewEngine: {
        extname: '.handlebars',
        partialsDir: path.resolve('./src/api/templates'),
      },
      viewPath: path.resolve('./src/api/templates'),
      extName: '.handlebars',
    }),
  );
}

export function getTransporter() {
  if (!transporter) {
    throw new Error('Email transport is not configured');
  }

  return transporter;
}
