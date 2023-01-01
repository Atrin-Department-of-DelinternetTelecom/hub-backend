'use strict';

module.exports = Object.freeze({
  commands: {
    signPad: {
      sign: 'sign-pad:sign',
      signCancelled: 'sign-pad:sign-cancelled',
      signDone: 'sign-pad:sign-done',
    },
    hrmsMessage: {
      send: 'hrms-message:send',
      sendAck: 'hrms-message:send-ack',
      new: 'hrms-message:new',
    },
    intranetMessage: {
      update: 'intranet-message:update',
    },
    notification: {
      new: 'notification:new',
      update: 'notification:update',
    },
    invoicePeriod: {
      update: 'invoicePeriod:update',
    },
    invoiceRemittance: {
      update: 'invoiceRemittance:update',
    },
    new_notification: 'new-notification',
    new_message: 'api.messages.new',
    bulk_update: 'bulk-update',
    counter_update: 'counter_update',
  },
});
