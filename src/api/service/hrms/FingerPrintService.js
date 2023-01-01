'use strict';

const { StaffFingerPrint, User, Anviz } = require('@models').system;
const { respondBadRequest } = require('@utils/response');
const { respondCreated } = require('@utils/response');
const { getAllEntities } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');

/**
 *
 * delete a finger print by id
 *
 * id String id of finger print table
 * returns Object
 **/
exports.deleteFingerprintsId = async function (id) {
  return await findAndDelete(id, StaffFingerPrint);
};

/**
 * Your GET endpoint
 * get all fingerprints record
 *
 * returns Object
 **/
exports.getFingerprints = async function (query) {
  return await getAllEntities(query, StaffFingerPrint);
};

/**
 * Your GET endpoint
 * get single finger print by id
 *
 * id String id of finger print table
 * returns Object
 **/
exports.getFingerprintsId = async function (id) {
  return await findAndGet(id, StaffFingerPrint);
};

/**
 * Your GET endpoint
 * get finger print records of a user in a device
 *
 * staff BigDecimal id of staff
 * device String id of device
 * returns Object
 **/
exports.getFingerprintsStaff = async function (staff, device) {
  return await StaffFingerPrint.findOne({
    where: {
      user_id: staff,
      anviz_id: device,
    },
  });
};

/**
 *
 * save a finger print record
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postFingerprintsId = async function (body, creator_id) {
  if (
    typeof body.user_id == 'undefined' ||
    (await User.findByPk(body.user_id)) === null
  ) {
    return respondBadRequest('user not found');
  }

  if (
    typeof body.anviz_id == 'undefined' ||
    (await Anviz.findByPk(body.anviz_id)) === null
  ) {
    return respondBadRequest('anviz not found');
  }
  body.creator_id = creator_id;
  return await StaffFingerPrint.create(body).catch((err) => console.log(err));
};

/**
 *
 * update an finger print by id
 *
 * id String id of finger print table
 * body Body for update existing record (optional)
 * returns Object
 **/
exports.putFingerprintsId = async function (id, body) {
  return await findAndUpdate(id, body, StaffFingerPrint);
};
