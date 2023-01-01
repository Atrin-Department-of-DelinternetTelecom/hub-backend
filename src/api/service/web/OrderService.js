'use strict';

const { getAllEntities, createCatch } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');
const {
  system: { Order, User },
} = require('@models');

const _ = require('lodash');
const {
  respondOK,
  respondInternalServerError,
} = require('@api/utils/response');
const { GoogleSheet } = require('../google/Sheet');
const config = require('@config');
const moment = require('moment');

/**
 *
 * delete a order record by id
 *
 * id String
 * returns Object
 **/
exports.deleteOrdersId = async function (id) {
  return findAndDelete(id, Order);
};

/**
 * Your GET endpoint
 * get all orders(information) record
 *
 * returns Object
 **/
exports.getOrders = async function (query) {
  return getAllEntities(query, Order, {}, [
    {
      model: User,
      as: 'user_processed',
    },
  ]);
};

/**
 * Your GET endpoint
 * get single order record by id
 *
 * id String
 * returns Object
 **/
exports.getOrdersId = async function (id) {
  const order = await Order.findByPk(id);
  console.log(JSON.parse(order.finger_print));

  return findAndGet(id, Order);
};

/**
 *
 * add a order record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postOrders = async function (body, creator_id) {
  body.creator_id = creator_id;
  return createCatch(body, Order);
};

/**
 *
 * update a order record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected order (optional)
 * returns Object
 **/
exports.putOrdersId = async function (id, body, auth_user_id) {
  if (
    !_.isUndefined(body.status) &&
    ['rejected', 'checked'].includes(body.status)
  ) {
    body.user_processed_id = auth_user_id;
  }
  return findAndUpdate(id, body, Order);
};

exports.syncSheet = async function () {
  const sheetConfig = config.get('index.webOrderGoogleSheet');
  if (!sheetConfig) return respondInternalServerError('config not found');

  const sheet = new GoogleSheet(sheetConfig.id);
  await sheet.syncModel(Order, sheetConfig.page, {
    id: null,
    web_id: null,
    procesed: (value) => (value ? 1 : 0),
    user_processed_id: null,
    status: null,
    fiscal_id: null,
    finger_print: (value) => value?.replace(/\n/g, ''),
    fiscal_doc: null,
    user_type: null,
    delinternet_user: null,
    company_name: null,
    name: null,
    surname1: null,
    surname2: null,
    email: null,
    phone: null,
    address_auto_complete: null,
    region: null,
    city: null,
    postal_code: null,
    address_street: null,
    address_number: null,
    address_stairway: null,
    address_floor: null,
    address_door: null,
    address_lat: null,
    address_lng: null,
    service: (value) => '',
    deletedAt: function (value) {
      return `${value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : ''}`;
    },
    updatedAt: function (value) {
      return `${value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : ''}`;
    },
    createdAt: function (value) {
      return `${value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : ''}`;
    },
    Month: function () {
      return `${moment(this.createdAt).format('MMM')}.`;
    },
  });

  return respondOK('web-order synced with google sheet');
};
