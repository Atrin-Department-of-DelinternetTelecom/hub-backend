'use strict';

const { CallMe, CallMeTaggable, CallMeTag, CallMeVisitor, User } =
  require('@models').system;
const { firstPopulated } = require('@api/utils/helpers');
const { getAllEntities, createCatch } = require('@utils/request-handler');
const { Get } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');
const assert = require('assert');
const moment = require('moment');
const { GoogleSheet } = require('../google/Sheet');
const {
  respondOK,
  respondInternalServerError,
} = require('@api/utils/response');
const config = require('@config');

/**
 *
 * delete a CallMe record by id
 *
 * id String
 * returns Object
 **/
exports.deleteCallMesId = async function (id) {
  return Get(id, CallMe);
};

/**
 * Your GET endpoint
 * get all CallMes(information) record
 *
 * returns Object
 **/
exports.getCallMes = async function (query) {
  return getAllEntities(query, CallMe, {}, [
    {
      model: User,
      as: 'user_processed',
    },
    {
      model: CallMeTag,
      as: 'tags',
    },
  ]);
};

/**
 * Your GET endpoint
 * get single CallMe record by id
 *
 * id String
 * returns Object
 **/
exports.getCallMesId = async function (id) {
  return findAndGet(id, CallMe);
};

/**
 *
 * add a call-me record
 *
 * body Body just have a name (optional)
 * returns Object
 **/
exports.postCallMes = async function (body, creator_id) {
  body.creator_id = creator_id;
  return createCatch(body, CallMe);
};

/**
 *
 * update a call-me record by id
 *
 * id String
 * body Body in this example we want to change
 * name of the selected call-me (optional)
 * returns Object
 **/
exports.putCallMesId = async function (id, body, processed_by_user_id) {
  body.processed_by_user_id = processed_by_user_id;
  const tags = body.tag ?? [];

  await CallMeTaggable.destroy({ where: { callme_id: id } });
  if (tags.length > 0) {
    await CallMeTaggable.bulkCreate(
      tags.map(({ id: tag, comment }) => {
        return {
          tag_id: tag,
          callme_id: id,
          comment: firstPopulated([comment]),
        };
      }),
    );
  }

  return findAndUpdate(id, body, CallMe);
};

exports.visitCallMesId = async function (id, visitor_id) {
  const callMe = await CallMe.findByPk(id);
  assert(callMe, 'Model not found');

  if (!callMe.processed_by_user_id) {
    await CallMeVisitor.create({
      visitor_id,
      callme_id: id,
    });
  }

  return findAndGet(id, CallMe);
};

exports.syncSheet = async function () {
  const sheetConfig = config.get('index.callMeGoogleSheet');
  if (!sheetConfig) return respondInternalServerError('config not found');

  const sheet = new GoogleSheet(sheetConfig.id);
  await sheet.syncModel(CallMe, sheetConfig.page, {
    id: null,
    name: null,
    phone_number: null,
    email: null,
    processed_by_user_id: null,
    metadata: (value) =>
      value ? JSON.stringify(value).replace(/\n/g, '') : '',
    status: null,
    description: null,
    deletedAt: function (value) {
      return `${value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : ''}`;
    },
    updatedAt: function (value) {
      return `${moment(value).format('YYYY-MM-DD HH:mm:ss')}`;
    },
    createdAt: function (value) {
      return `${moment(value).format('YYYY-MM-DD HH:mm:ss')}`;
    },
    client_id: null,
    processed_at: function (value) {
      return `${value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : ''}`;
    },
    reference: null,
    Month: function () {
      return `${moment(this.createdAt).format('MMM')}.`;
    },
  });

  return respondOK('call-me synced with google sheet');
};
