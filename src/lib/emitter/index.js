'use strict';

const { EventEmitter } = require('events');

//global event emitter
// TODO(erfan): global event emitter is a bad thing. follow project structure protocol
const eventEmitter = new EventEmitter();

const getEventEmitter = () => {
  return eventEmitter;
};

module.exports = {
  getEventEmitter,
  SETTING_001_UPDATE_APP_JSON_ADD_APP: 'SETTING_001_UPDATE_APP_JSON_ADD_APP',
  SETTING_002_UPDATE_APP_JSON_ADD_MENU: 'SETTING_002_UPDATE_APP_JSON_ADD_MENU',
  // update app.json after delete an app or menu
  SETTING_003_DELETE_APP_JSON_ADD_APP: 'SETTING_003_DELETE_APP_JSON_ADD_APP',
  SETTING_004_DELETE_APP_JSON_ADD_MENU: 'SETTING_004_DELETE_APP_JSON_ADD_MENU',

  //add notification with global notification
  GLOBAL_NOTIFICATION_001_ADD_NOTIFICATION:
    'GLOBAL_NOTIFICATION_001_ADD_NOTIFICATION',

  // save first page image of EXT
  GLOBAL_SAVE_IMAGE_OF_PDF: 'GLOBAL_SAVE_IMAGE_OF_PDF',
  GLOBAL_SAVE_IMAGE_OF_HANDLEBARS: 'GLOBAL_SAVE_IMAGE_OF_HANDLEBARS',
  GLOBAL_SAVE_IMAGE_OF_HTML: 'GLOBAL_SAVE_IMAGE_OF_HTML',
};
