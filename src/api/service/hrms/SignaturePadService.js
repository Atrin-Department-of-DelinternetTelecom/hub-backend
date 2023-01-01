// @ts-check
'use strict';

const {
  system: { SignaturePad, User },
} = require('@models');

const {
  getAllEntities,
  createCatch,
  findAndGet,
  findAndUpdate,
} = require('@utils/request-handler');

const socket = require('@lib/socket');

const {
  respondOK,
  respondBadRequest,
  respondNotFound,
  respondSuccess,
} = require('@utils/response');

const assert = require('assert');

const { commands: _commands } = require('@constants/ws');

const commands = _commands.signPad;

exports.deleteSignaturePadsId = async function (id) {
  const signaturePad = await SignaturePad.findByPk(id);
  if (!signaturePad) {
    return respondNotFound(`signature pad with id ${id} not found`);
  }

  await SignaturePad.destroy({
    where: {
      id,
    },
    force: true,
  });

  return respondSuccess(`signature pad with ${id} deleted`);
};

exports.getSignaturePads = async function (query) {
  return getAllEntities(query, SignaturePad, undefined, [
    {
      model: User,
      as: 'login_as',
    },
  ]);
};

exports.getSignaturePadsId = async function (id) {
  return findAndGet(id, SignaturePad);
};

exports.postSignaturePad = async function (body, creator_id) {
  body.creator_id = creator_id;
  return createCatch(body, SignaturePad);
};

exports.putSignaturePadsId = async function (id, body) {
  return findAndUpdate(id, body, SignaturePad);
};

/**
 *
 * @param {number} id
 * @param {unknown} user
 * @param {any} body
 * @returns
 */
exports.requestSign = async function (id, user, body) {
  const pad = await SignaturePad.findByPk(id);
  if (!pad) return respondNotFound(`pad with id:${id} not found`);
  if (pad.is_busy) return respondBadRequest('signature pad is busy');

  socket.emitIn(String(pad.login_as_id), commands.sign, {
    user: user,
    pad_id: pad.id,
    params: body?.params ?? {},
  });

  await pad.update({
    is_busy: true,
  });

  return respondOK('request to sign done');
};

/**
 *
 * @param {number} id
 * @returns
 */
exports.cancelSign = async function (id) {
  const pad = await SignaturePad.findByPk(id);
  if (!pad) return respondNotFound(`pad with id:${id} not found`);

  // socket.emitIn(sign_owner, commands.signCancelled, {
  //   pad: pad,
  //   params: JSON.parse(param),
  // });

  await pad.update({
    is_busy: false,
  });
  return respondOK('signature pad is not busy now');
};

/**
 *
 * @param {number} id sign-pad id
 * @param {number} signOwner
 * @param {{ data: Buffer }} signatureFile
 * @param {string} params
 * @returns
 */
exports.replySign = async function (id, signOwner, signatureFile, params) {
  const pad = await SignaturePad.findByPk(id);
  if (!pad) return respondNotFound(`pad with id:${id} not found`);

  await pad.update({
    is_busy: false,
  });

  assert(signatureFile?.data, 'data not found in message');

  const imgBase64 = signatureFile.data.toString('base64');
  socket.emitIn(String(signOwner), commands.signDone, {
    pad: pad,
    file: imgBase64,
    params: JSON.parse(params),
  });

  return respondOK('done');
};
