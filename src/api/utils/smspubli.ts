import { Smspubli, Message } from '@erfanium/smspubli';

import { fetch, Headers, Request, Response } from 'undici';

// apply fetch global polyfill for node 16
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
globalThis.fetch = fetch;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
globalThis.Headers = Headers;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
globalThis.Request = Request;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
globalThis.Response = Response;

const enable = !!process.env.SMS_KEY;
const report_url = process.env.SMS_REPORT_URL;

if (!enable)
  console.warn('Smspubli service is disabled. because SMS_KEY env is not set');

export const smspubli = enable
  ? new Smspubli({
      apiKey: process.env.SMS_KEY!,
      from: process.env.SMS_FROM ?? 'Delinternet',
      fake: process.env.SMS_FAKE === 'true',
    })
  : null;

export async function sendSingle(message: Message) {
  if (!smspubli) return;

  const result = await smspubli.send({
    messages: [message],
    concat: true,
    report_url,
  });

  return result[0];
}
