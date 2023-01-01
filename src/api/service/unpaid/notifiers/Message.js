'use strict';

class Message {
  constructor(notification) {
    const { id, unpaidInvoice, message, contactPhone } = notification;
    const { client } = unpaidInvoice;
    const {
      contactName,
      contactFamilyName1,
      contactFamilyName2,
      emailAddress,
    } = client;

    this.notificationId = id;

    this.contact = {
      first_name: contactName,
      last_name: [contactFamilyName1, contactFamilyName2].join(' '),
      phone: contactPhone,
      email: emailAddress,
    };
    this.message = message;
  }

  getNotificationId() {
    return this.notificationId;
  }

  getMessage() {
    return {
      ...this.contact,
      message: this.message,
    };
  }
}

exports.Message = Message;
