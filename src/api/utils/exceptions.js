'use strict';

class CodedError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

exports.CodedError = CodedError;
exports.ExceptionsCode = {
  //**unpaid**//
  //template not exist in the templates service
  Unpaid001: (type) =>
    new CodedError('Unpaid001', `template ${type} not exist`),

  //max sms notification capacity has been exceed
  Unpaid002: (invoiceId) =>
    new CodedError(
      'Unpaid002',
      `Invoice with id ${invoiceId} has exceeded the maximum capacity to send SMS notifications.`,
    ),

  //invoice status is not valid for sending notification
  Unpaid003: (InvoiceId) =>
    new CodedError(
      'Unpaid003',
      `Invalid Unpaid Invoice status for send Notification!::${InvoiceId}`,
    ),

  //
  Unpaid004: (notiId, send_status) =>
    new CodedError(
      'Unpaid004',
      `Is not possible to resent a '${send_status}' notification for notification ${notiId}`,
    ),

  //invoice status is not valid for sending notification
  Unpaid005: (notification_id) =>
    new CodedError(
      'Unpaid005',
      `Unpaid Invoice not found for ${notification_id}`,
    ),

  //It Was Not Possible To Send Notification With Any Notifier
  Unpaid006: (notification_id) =>
    new CodedError(
      'Unpaid006',
      `It is not possible to send notification with any notifier :: notification Id${notification_id}`,
    ),

  //send_method is null or not exist
  Unpaid007: (notification_id, send_method) =>
    new CodedError(
      'Unpaid007',
      `send method is not valid notification Id${notification_id},send_method:${send_method}`,
    ),

  Unpaid008: (notification_id, send_method) =>
    new CodedError(
      'Unpaid008',
      `client number not found${notification_id},send_method:${send_method}`,
    ),

  Unpaid009: (notification_id, send_method) =>
    new CodedError(
      'Unpaid009',
      `notification with id${notification_id},send_method:${send_method}, was retried by another notification and fail.`,
    ),

  Unpaid010: (notification_id, send_method) =>
    new CodedError(
      'Unpaid010',
      `notification with id${notification_id},send_method:${send_method}, fail and doesn't try another way.`,
    ),

  Unpaid011: (number) =>
    new CodedError('Unpaid011', `Invalid Phone Number: ${number}`),

  Unpaid012_InvalidCronJobException: () =>
    new CodedError(
      'InvalidCronJobException',
      'Invalid Job Value! Select one of [block, unblock]',
    ),

  Unpaid013_ClientIsAlreadyBlockException: (client_id) =>
    new CodedError(
      'ClientIsAlreadyBlockException',
      `Client With Id ${client_id} is already blocked!`,
    ),

  Unpaid014_ClientHasAPendingCutTaskException: (client_id) =>
    new CodedError(
      'ClientHasAPendingCutTaskException',
      `Client With Id ${client_id} has pending task! (connect/reconnect)`,
    ),

  Unpaid015_ClientHasAnyContractException: (client_id) =>
    new CodedError(
      'ClientHasAnyContractException',
      `Client with id ${client_id} has not any contracts!`,
    ),

  Unpaid016_ClientResponsed: (result) =>
    new CodedError('ClientResponsed', `client ${result} this change fee`),

  Unpaid017_CanNotCreateNewNotification: () =>
    new CodedError(
      'CanNotCreateNewNotification',
      `send notification fail and can not create new notification`,
    ),

  Unpaid018_CanNotSendTelegramNotification: (notification_id) =>
    new CodedError(
      'CanNotSendTelegramNotification',
      `fali to send notification with id ${notification_id}. client has no cantact with this number`,
    ),

  Unpaid019_UnpaidInvoiceHasPaid: (unpaid_invoice_id) =>
    new CodedError(
      'UnpaidInvoiceHasPaid',
      `Unpaid invoice with id ${unpaid_invoice_id} has paid`,
    ),
};
