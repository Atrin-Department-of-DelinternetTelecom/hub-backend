'use strict';

const {
  system: { Vehicle, VehicleDriver, File, User },
} = require('@models');
const path = require('path');
const config = require('@config');
const status = require('http-status');
const { respondBadRequest } = require('@utils/response');
const { respondCreated } = require('@utils/response');
const { getAllEntities } = require('@utils/request-handler');
const { findAndDelete } = require('@utils/request-handler');
const { findAndGet } = require('@utils/request-handler');
const { findAndUpdate } = require('@utils/request-handler');

/**
 *
 * delete a vehicle by id
 *
 * id String id of table vehicle
 * returns Object
 **/
exports.deleteVehiclesId = async function (id) {
  return await findAndDelete(id, Vehicle);
};

/**
 * Your 1 endpoint
 * if we call this without id, we get all vehicles and if we call this with id we get single vehicle with id
 *
 * returns Object
 **/
exports.getVehicles = async function (query) {
  return await getAllEntities(query, Vehicle);
};

exports.getVehiclesId = async function (id) {
  return await findAndGet(id, Vehicle);
};

/**
 *
 * attach a vehicle to a user with some information
 * => if exit_date was setted then create new one else update existing record
 * body Body  (optional)
 * returns Object
 **/
//CHECK: we can change object field and cast it to one object
exports.postVehicleUser = async function (body, creator_id = null) {
  const { vehicle_id, driver_id } = body;

  if (
    typeof driver_id == 'undefined' ||
    (await User.findByPk(driver_id)) === null
  ) {
    return respondBadRequest('user not found');
  }

  if (
    typeof vehicle_id == 'undefined' ||
    (await Vehicle.findByPk(vehicle_id)) === null
  ) {
    return respondBadRequest('vehicle not found');
  }

  //find last vehicle user record
  const vehicleUserRecord = await VehicleDriver.findOne({
    where: {
      vehicle_id,
      driver_id,
    },
    order: [['createdAt', 'DESC']],
  });
  //check that this is exist or no and end_date was setted then update and else create new one
  if (vehicleUserRecord !== null && vehicleUserRecord.end_date === null) {
    await VehicleDriver.update(body, {
      where: {
        id: vehicleUserRecord.id,
      },
    });
    return await VehicleDriver.findOne({
      where: {
        id: vehicleUserRecord.id,
      },
    });
  } else {
    body.creator_id = creator_id;
    return await VehicleDriver.create(body);
  }
};

exports.attachMediaToVehicleUser = async function (images, vehicleUser) {
  let km_image_start = null;
  let km_image_end = null;
  if (images.km_image_start) {
    const fileName =
      `km-image-start-${new Date().toDateString()}-` +
      images.km_image_start.name;
    const pathFile = path.resolve('uploads', 'kilometer images', fileName);
    images.km_image_start.mv(
      path.resolve(
        config.get('index.root'),
        'uploads',
        'kilometer images',
        fileName,
      ),
    );
    km_image_start = await File.create({
      file: pathFile,
      fileable_type: 'vehicleUser',
      is_valid: true,
      fileable_id: vehicleUser.id,
    });
    vehicleUser.km_image_start = km_image_start.id;
  }

  if (images.km_image_end) {
    const fileName =
      `km-image-end-${new Date().toDateString()}-` + images.km_image_end.name;
    const pathFile = path.resolve('uploads', 'kilometer images', fileName);
    images.km_image_end.mv(
      path.resolve(
        config.get('index.root'),
        'uploads',
        'kilometer images',
        fileName,
      ),
    );
    km_image_end = await File.create({
      file: pathFile,
      fileable_type: 'vehicleUser',
      is_valid: true,
      fileable_id: vehicleUser.id,
    });
    vehicleUser.km_image_end = km_image_end.id;
  }

  await vehicleUser.save();
};

/**
 *
 * add new vehicle
 *
 * body Body  (optional)
 * returns Object
 **/
exports.postVehicles = async function (body, creator_id) {
  body.creator_id = creator_id;
  return respondCreated(await Vehicle.create(body));
};

/**
 *
 * update a vehicle by id
 *
 * id String id of table vehicle
 * body Body should change name of vehicle (optional)
 * returns Object
 **/
exports.putVehiclesId = async function (id, body) {
  return await findAndUpdate(id, body, Vehicle);
};
