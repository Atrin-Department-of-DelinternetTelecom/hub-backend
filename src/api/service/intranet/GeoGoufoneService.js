'use strict';

const { GfClient, GfContractDataInternet, CrTask } =
  require('@models').intranet;

const GfAssistService = require('./GfAssistService');

const GfSectionService = require('./GfSectionService');

/**
 * get address object and normalize address and attach extra info
 * @param {object} address address information like street name, city and ...
 * @param {boolean} fromDatabase check for change key
 * @returns normalized and extra info based on address input
 */
exports.getFormatedAddress = (address, fromDatabase = false) => {
  // if address is a sequelize model instance, convert it to plain js object
  if (typeof address.get === 'function') {
    address = address.get({ plain: true });
  }

  const nAddress = {};
  if (fromDatabase) {
    for (const key in address) {
      if (key.substring(0, 7) === 'address') {
        const newKey =
          key.replace('address', '').charAt(0).toLowerCase() +
          key.replace('address', '').slice(1);
        nAddress[newKey] = address[key];
      }
    }
    address = nAddress;
  }

  let building = address.building;
  building = valid(building) ? `building ${building}` : '';

  let stairway = address.stairway;
  stairway = valid(stairway) ? `stairway ${stairway}` : '';

  let floor = address.floor;
  floor = valid(floor) ? `${floor}º` : '';

  let door = address.door;
  door = valid(door) ? `${door}ª` : '';

  let floorDoor = `${floor}${door}`;
  if (floor && door) {
    floorDoor = `${floor}-${door}`;
  }

  let buildingStair = `${building}${stairway}`;
  if (building && stairway) {
    buildingStair = `${building}, ${stairway}`;
  }

  const line1 = `${address.street}${
    address.number ? `, ${address.number}` : ''
  } ${floorDoor}`;
  const line2 = buildingStair;
  const line3 = `${address.postalCode} ${address.city}`;
  const line4 = `${address.province}`;

  /**
   * todo:get api key from env file
   */
  const url = ``; // `https://maps.googleapis.com/maps/api/staticmap?center=${address.lat},${address.lng}&zoom=17&&size=300x300&markers=color:red%7Clabel:C%7C${address.lat},${address.lng}&key=${'TODONOW'}`
  const url2 = ``; // `https://maps.googleapis.com/maps/api/staticmap?center=${address.lat},${address.lng}&zoom=15&&size=120x120&markers=color:red%7Clabel:C%7C${address.lat},${address.lng}&key=${'TODONOW'}`

  const html = `${line1}<br>${line2 ? `${line2}<br>` : ''}${line3}<br>${line4}`;
  return {
    line1,
    line2,
    line3,
    line4,
    mapUrl: url,
    mapMiniUrl: url2,
    lat: address.lat,
    lng: address.lng,
    html,
    values: address,
  };
};

/**
 * used for validation of some fild in formated address
 * @param {string} input string value to check is valid or no
 * @returns {boolean} is valid or no
 */
const valid = (input) => {
  const ignoreValues = ['default', 'OD', 'OS', 'T', '.'];
  return !(ignoreValues.includes(input) || !input);
};

/**
 * get formated address based on relation and information in assist
 * @param {object} assist assist information for get address
 * @returns {object} formated address related to input assist
 */
exports.getAssistanceAddress = async (assist) => {
  const type = await GfSectionService.getContractSectionCode(assist.contractId);
  const section = await GfSectionService.getContractSection(
    assist.contractId,
    type,
  );

  let address = {};
  switch (type) {
    case 'INTERNET':
      if (section && section.id) {
        address = exports.getFormatedAddress(section, true);
      }
      break;
    case 'FIX':
      if (section && section.internetSectionId > -1) {
        const internetSection = await GfContractDataInternet.findOne({
          where: {
            contractId: section.internetSectionId,
          },
        });
        if (internetSection) {
          address = exports.getFormatedAddress(internetSection, true);
        }
      }
      break;
    default: {
      const assistTrace = await GfAssistService.getAssistanceTrace(assist);
      const mainEvent = await CrTask.findOne({
        where: {
          refererTrace: [
            assistTrace,
            assistTrace.replace(`_assist`, `_agendation`),
          ],
        },
      });

      const client = await GfClient.findOne({
        where: {
          invoiceClientId: mainEvent.clientId,
        },
      });
      address = exports.getFormatedAddress(client, true);
      break;
    }
  }
  return address;
};
