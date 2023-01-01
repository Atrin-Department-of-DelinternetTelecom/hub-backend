'use strict';
const { GfPhonePrefix, GfFixCallTypes, GfPhonePrefixGroupsXref } =
  require('@models').intranet;

const _ = require('lodash');

/**
 * attach extra information to phone number
 * @param {string} number phone number that we want to attach extra informaion
 * @returns {Promise<object>}
 */
exports.findNumber = async (number) => {
  const { parsed, indexed } = await exports.getPrefixes();
  number = exports.cleanNumber(number);
  let finalRate = null;
  const reverseKeys = Object.keys(parsed).reverse();
  for (const length of reverseKeys) {
    const parse = parsed[length];
    if (number.length < parseInt(length)) {
      continue;
    }
    if (parse.includes(number.substring(0, parseInt(length)))) {
      finalRate = indexed[number.substring(0, parseInt(length))];
      break;
    }
  }

  let callType;
  let group = [];
  if (finalRate) {
    callType = (await getCallType())[finalRate.type];
    group = _.get(await getPrefixesGroups(), `${finalRate.code}`, []);
  }
  const groupIds = group.map((g) => g.fixCallTypeId);

  return {
    success: !!finalRate,
    type: finalRate?.type ?? undefined,
    ratedNum: number,
    description: finalRate?.description ?? undefined,
    finalRate,
    primaryCallType: callType,
    groupIds,
  };
};

/**
 * remove 0034 or 34 from first of number
 * @param {string} number phone number to normalize
 * @returns {string}
 */
exports.cleanNumber = (number) => {
  if (number.substring(0, 4) === '0034') {
    number = number.substring(4);
  } else if (number.substring(0, 2) === '34') {
    number = number.substring(2);
  }
  return number;
};

/**
 * @type {Promise<any>}
 */
let _prefixesCachePromise = null;

/**
 * get all phone prefix and normalize to parsed and indexed
 * @returns {object}
 */
exports.getPrefixes = () => {
  if (_prefixesCachePromise) return _prefixesCachePromise;
  _prefixesCachePromise = exports.generatePrefixes();
  return _prefixesCachePromise;
};

/**
 * generate prefixed and save to cache. used for onAfter update GfPhonePrefix and getPrefixes
 * @returns {Promise<object>}
 */
exports.generatePrefixes = async () => {
  const rates = await GfPhonePrefix.findAll({
    where: {
      prefixType: 'prefix',
    },
  });

  const pRates = {};
  const iRates = {};

  for (const rate of rates) {
    const rateInfo = _.get(pRates, `${rate.prefix.length}`, []);
    rateInfo.push(rate.prefix);
    _.setWith(pRates, `${rate.prefix.length}`, rateInfo, Object);
    iRates[rate.prefix] = rate;
  }

  return {
    parsed: pRates,
    indexed: iRates,
  };
};

/**
 * @type {Promise<any>}
 */
let _callTypesCachePromise = null;

/**
 * return all fixCallType indexed by kamailioRef
 * @returns {Promise<object>}
 */
const getCallType = async () => {
  if (_callTypesCachePromise) return _callTypesCachePromise;
  _callTypesCachePromise = generateCallType();
  return _callTypesCachePromise;
};

const generateCallType = async () => {
  const indexedByKamailioRef = {};
  (await GfFixCallTypes.findAll()).forEach((fixCallType) => {
    indexedByKamailioRef[fixCallType.kamailioRef] = fixCallType;
  });
  return indexedByKamailioRef;
};

/**
 * get all GfPhonePrefixGroupsXref indexed by prefixCode
 * @returns {Promise<object>}
 */
const getPrefixesGroups = async () => {
  const prefixesGroups =
    await getAllGfPhonePrefixGroupsXrefIndexedByPrefixCode();
  // foreach($M->prefixesGroups as $k => $v){//TODO implement
  //     foreach($v as $_k => $_v){
  //         $gt = $ado2->selectOne([
  //             "id"    => $_v['fixCallTypeId']
  //         ]);
  //         if (!$gt){
  //             unset($M->prefixesGroups[$k][$_k]);
  //         }
  //     }
  // }
  return prefixesGroups;
};

/**
 * @type {Promise<any>}
 */
let _prefixGroupCachePromise = null;

/**
 * get all GfPhonePrefixGroupsXref indexed by prefixCode
 * @returns {Promise<object>}
 */
const getAllGfPhonePrefixGroupsXrefIndexedByPrefixCode = async () => {
  if (_prefixGroupCachePromise) return _prefixGroupCachePromise;
  _prefixGroupCachePromise =
    generateAllGfPhonePrefixGroupsXrefIndexedByPrefixCode();
  return _prefixGroupCachePromise;
};

const generateAllGfPhonePrefixGroupsXrefIndexedByPrefixCode = async () => {
  const indexedByPrefixCode = {};
  (await GfPhonePrefixGroupsXref.findAll()).forEach((xref) => {
    indexedByPrefixCode[xref.prefixCode] = xref;
  });
  return indexedByPrefixCode;
};

GfPhonePrefix.afterCreate((instance, options) => {
  exports.generatePrefixes();
});

GfPhonePrefix.afterUpdate((options) => {
  exports.generatePrefixes();
});

GfPhonePrefix.afterBulkUpdate((options) => {
  exports.generatePrefixes();
});
