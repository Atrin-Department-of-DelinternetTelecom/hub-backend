//@ts-check
/**
 * //TODO: should check to if not need remove it
 * @deprecated
 * */
'use strict';
// const { Location, Geofence, LocationHistory } = require('@models').system;
// const { Op } = require('sequelize');
// const { Static } = require('@lib/cache');
// const Sequelize = require('sequelize');
// const pointInPolygon = require('point-in-polygon');
// const { modelToJson } = require('@utils/tools');
// const { respondSuccess } = require('@utils/response');
// /**
//  * @deprecated
//  * Your GET endpoint
//  * check that the point is in polygon or no
//  *
//  * geofence_id BigDecimal id of area
//  * point String lat and lng
//  * returns Boolean
//  **/

// //TODO: implement this part by js
// exports.getLocationsPointinpolygon = async function (geofence_id, point) {
//   const geofence = await Geofence.findOne({
//     where: {
//       id: geofence_id,
//     },
//   });
//   return {
//     inside: pointInPolygon(point, geofence.area.coordinates[0]),
//   };
// };

// /**
//  * Your GET endpoint
//  * get last location of users
//  *
//  * returns Object
//  **/
// exports.getLocationsUser = async function () {
//   return respondSuccess(
//     Object.values(
//       Static.store.all().filter((value, key) => {
//         return key.includes('user:');
//       }),
//     ),
//   );
// };

// /**
//  * Your GET endpoint
//  * get last location of vehicles
//  *
//  * returns Object
//  **/
// exports.getLocationsVehicle = async function () {
//   return respondSuccess(
//     Object.values(
//       Static.store.all().filter((value, key) => {
//         return key.includes('vahicle:');
//       }),
//     ),
//   );
// };

// /**
//  *
//  * insert new location
//  *
//  * body Body  (optional)
//  * returns Object
//  **/
// exports.postLocations = async function (body) {
//   const newLocationObj = modelToJson(await saveToDataBase(body));
//   const oldLocationObj = Static.get(
//     `${newLocationObj.locationable_type}:${newLocationObj.locationable_id}`,
//   );
//   if (oldLocationObj == undefined || isTimeToCache(oldLocationObj.createdAt)) {
//     addLocationToCache(newLocationObj);
//   }
//   return respondSuccess('location saved');
// };

// const addLocationToCache = (locationObj) => {
//   Static.remember(
//     `${locationObj.locationable_type}:${locationObj.locationable_id}`,
//     locationObj,
//   );
// };

// const isTimeToCache = (lastLocationInsertTime) => {
//   const now = new Date();
//   const lastInsert = new Date(lastLocationInsertTime);
//   const diff = now - lastInsert;
//   if (now - lastInsert > 1000) {
//     return true;
//   }
//   return false;
// };

// const saveToDataBase = async (body) => {
//   const { location, locationable_id, locationable_type } = body;
//   const point = {
//     type: 'Point',
//     coordinates: [location.lat, location.lng],
//   };
//   return Location.create({
//     locationable_id,
//     locationable_type,
//     location: Sequelize.fn('ST_GeomFromGeoJSON', JSON.stringify(point)),
//     creator_id: 23,
//   });
// };

// /**
//  *
//  * add a polygon (area)
//  *
//  * body Body at least we need to define three point (optional)
//  * returns Object
//  **/
// exports.postLocationsPolygon = function (body) {
//   console.log(body);
//   return {};
// };
