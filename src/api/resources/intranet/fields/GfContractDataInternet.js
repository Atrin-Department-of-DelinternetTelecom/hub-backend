'use strict';

const { DataTypes } = require('sequelize');
const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const moment = require('moment');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const TextField = require('@lib/crud/Fields/Text');
const UID = require('@lib/crud/Fields/UID');
const ArrayField = require('@lib/crud/Fields/Array');

module.exports = class GfContractDataInternet extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return array
   */
  fields(request) {
    return [
      new ID(),

      new UID('UID', 'uid'),

      new TextField('Password Of Radius User', 'nodeRadiusPassword').nullable(),

      new TextField(
        'Profile Sufix Of Radius User',
        'radiusProfileSufix',
      ).nullable(),

      new TextField('Latitude', 'lat').nullable(),

      new TextField('Longitude', 'lng').nullable(),

      ...this.addressFields(),

      new NumberField('installationDuration', 'installationDuration')
        .nullable()
        .default(2)
        .help('minutes'),

      new DateTime('Instalation Date', 'instalationDate')
        .nullable()
        .default('')
        .swagger('format', ''),

      new NumberField('Installator User Id', 'installatorUserId')
        .nullable()
        .default(0),

      new NumberField('Installation Done', 'installationDone').default(0),

      new TextField('Installation Level', 'installationLevel')
        .nullable()
        .help('Accept `level_1`, `level_2`, `level_3` values')
        .sequelize('set', function (value) {
          this.setDataValue('installationLevel', value ? value : null);
        }),

      ...this.CpeFields(),

      ...this.imageFields(),

      new NumberField('Id of the contract', 'contractId')
        .exceptOnForms()
        .nullable(),

      new TextField('IP', 'ip')
        .exceptOnForms()
        .default('')
        .sequelizeGet((attribute, model) => {
          return String(model.getDataValue(attribute) || '');
        })
        .sequelizeSet((value, attribute, model) => {
          model.setDataValue(
            attribute,
            [null, undefined].includes(value) ? '' : value,
          );
        }),

      new TextField('Static Ip', 'staticIp').exceptOnForms().nullable(),
      new TextField('ipv6', 'ipv6').exceptOnForms().nullable(),
      new TextField('IPv6_prefix', 'IPv6_prefix').exceptOnForms().nullable(),

      new TextField('MAC Address', 'mac').exceptOnForms().nullable(),

      new TextField('guifi Ip', 'guifiNetIp').exceptOnForms().nullable(),

      new TextField('Node', 'node').exceptOnForms().nullable(),

      new TextField('Node Radius Name', 'nodeRadiusName')
        .exceptOnForms()
        .nullable(),

      new TextField('Coa Message', 'lastCoaMessage').exceptOnForms().nullable(),

      new TextField('old Web Node Name', 'oldWebNodeName')
        .exceptOnForms()
        .nullable(),

      new TextField('Radios Ip', 'radiosIp').exceptOnForms().nullable(),

      new TextField('Info Repair', 'infoRepair').exceptOnForms().nullable(),

      new NumberField('Invoiced', 'invoiced').exceptOnForms().nullable(),

      new TextField('guifiZona', 'guifiZona').exceptOnForms().nullable(),

      new TextField('guifiLat', 'guifiLat').exceptOnForms().nullable(),

      new TextField('guifiLon', 'guifiLon').exceptOnForms().nullable(),

      new TextField('guifiNodeName', 'guifiNodeName')
        .exceptOnForms()
        .nullable(),

      new TextField('guifiName', 'guifiName').exceptOnForms().nullable(),

      new TextField('guifiUrl', 'guifiUrl').exceptOnForms().nullable(),

      new TextField('signed', 'signed').exceptOnForms().nullable(),

      new TextField('materialDescription', 'materialDescription')
        .exceptOnForms()
        .nullable()
        .sequelize('type', 'text'),

      new TextField('box').exceptOnForms().nullable(),

      new TextField('providerCode', 'providerCode').exceptOnForms().nullable(),

      new NumberField('Deleted?', 'status')
        .default(1)
        .exceptOnForms()
        .nullable(),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),

      new TextField('State')
        .exceptOnForms()
        .nullable()
        .sequelize('type', DataTypes.VIRTUAL)
        .sequelize('set', () => {})
        .sequelize('get', function () {
          if (this.getDataValue('installationDone')) return 'step2.5';

          return moment(this.getDataValue('instalationDate')).isAfter(
            moment(),
          ) && this.getDataValue('installatorUserId')
            ? 'step2'
            : 'step1';
        }),

      new NumberField('config_wifi_on_reconfig', 'config_wifi_on_reconfig')
        .nullable()
        .default(0),

      new ArrayField('coWorkers', 'coWorkers')
        .onlyOnForms()
        .nullable()
        .default([]),
    ];
  }

  addressFields() {
    return [
      new TextField('Address Region', 'addressRegion').nullable(),

      new TextField('Address Region Code', 'addressRegionCode').nullable(),

      new TextField(
        'Address Region Code Name',
        'addressRegionCodeName',
      ).nullable(),

      new TextField('Address Province', 'addressProvince').nullable(),

      new TextField('Address Province Code', 'addressProvinceCode').nullable(),

      new TextField(
        'Address Province Code Name',
        'addressProvinceCodeName',
      ).nullable(),

      new TextField('Address City', 'addressCity').nullable(),

      new TextField('Address City Code', 'addressCityCode').nullable(),

      new TextField('Address City Code Name', 'addressCityCodename').nullable(),

      new TextField('Address PostalCode', 'addressPostalCode').nullable(),

      new TextField(
        'Address PostalCode Code',
        'addressPostalCodeCode',
      ).nullable(),

      new TextField(
        'Address PostalCode Code Name',
        'addressPostalCodeCodeName',
      ).nullable(),

      new TextField('Address Street', 'addressStreet').nullable(),

      new TextField('Address Street Code', 'addressStreetCode').nullable(),

      new TextField(
        'Address Street Code Name',
        'addressStreetCodeName',
      ).nullable(),

      new TextField(
        'Address StreetType Code',
        'addressStreetTypeCode',
      ).nullable(),

      new TextField(
        'Address StreetType Code Name',
        'addressStreetTypeCodeName',
      ).nullable(),

      new TextField('Address Number', 'addressNumber').nullable(),

      new TextField('Address Number Code', 'addressNumberCode').nullable(),

      new TextField(
        'Address Number Code Name',
        'addressNumberCodeName',
      ).nullable(),

      new TextField('Address Floor', 'addressFloor').nullable(),

      new TextField('Address Floor Code', 'addressFloorCode').nullable(),

      new TextField(
        'Address Floor Code Name',
        'addressFloorCodeName',
      ).nullable(),

      new TextField('Address Building', 'addressBuilding').nullable(),

      new TextField('Address Building Code', 'addressBuildingCode').nullable(),

      new TextField(
        'Address Building Code Name',
        'addressBuildingCodeName',
      ).nullable(),

      new TextField('Address Door', 'addressDoor').nullable(),

      new TextField('Address Door Code', 'addressDoorCode').nullable(),

      new TextField('Address Door Code Name', 'addressDoorCodeName').nullable(),

      new TextField('Address Stairway', 'addressStairway').nullable(),

      new TextField('Address Stairway Code', 'addressStairwayCode').nullable(),

      new TextField(
        'Address Stairway Code Name',
        'addressStairwayCodeName',
      ).nullable(),

      new TextField('address Latitude', 'addressLat').nullable(),

      new TextField('address Longitude', 'addressLng').nullable(),

      new TextField('address Map Url', 'addressMapUrl').nullable(),
    ];
  }

  CpeFields() {
    return [
      new TextField('CPE Dsn', 'cpeDsn').nullable(),

      new TextField('CPE Sn', 'cpeSn').nullable(),

      new TextField('CPE Device ID', 'cpeDeviceId').nullable(),

      new TextField('CPE Model', 'cpeModel').nullable(),

      new TextField('CPE VoipProfile', 'cpeVoipProfile').nullable(),

      new TextField('CPE PPPOE Username', 'cpePppoeUsername').nullable(),

      new TextField('CPE PPPOE Password', 'cpePppoePassword').nullable(),

      new TextField('CPE Wifi SSID', 'cpeWifiSsid').nullable(),

      new TextField('CPE Wifi Password', 'cpeWifiPassword').nullable(),

      new TextField('CPE ID', 'cpeId').nullable(),

      new TextField('CPE Line Profile', 'cpeLineProfile').nullable(),
    ];
  }

  imageFields() {
    return [
      new TextField('First Image', 'image1').nullable(),

      new TextField('Second Image', 'image2').nullable(),

      new TextField('Third Image', 'image3').nullable(),

      new TextField('Fourth Image', 'image4').nullable(),

      new TextField('Fifth Image', 'image5').nullable(),

      new TextField('Sixth Image', 'image6').nullable(),

      new TextField('Seventh Image', 'image7').nullable(),

      new TextField('Eighth Image', 'image8').nullable(),

      new TextField('Ninth Image', 'image9').nullable(),

      new TextField('Tenth Image', 'image10').nullable(),

      new TextField('Eleventh Image', 'image11').nullable(),

      new TextField('Twelfth Image', 'image12').nullable(),

      new TextField('Thirteenth Image', 'image13').nullable(),
    ];
  }
};
