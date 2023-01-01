'use strict';

exports.ChangeFeeMessage = class ChangeFeeMessage {
  constructor(notification) {
    const { id, client, message, contactPhone } = notification;
    const { contactName, contactFamilyName1, contactFamilyName2 } = client;

    this.notificationId = id;

    this.contact = {
      first_name: contactName,
      last_name: `${contactFamilyName1} ${contactFamilyName2}`,
      phone: contactPhone,
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
};
