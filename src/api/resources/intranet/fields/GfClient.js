//@ts-check
'use strict';
const BooleanField = require('@lib/crud/Fields/Boolean');
const DateTime = require('@lib/crud/Fields/DateTime');
const ID = require('@lib/crud/Fields/ID');
const models = require('@models');
const NumberField = require('@lib/crud/Fields/Number');
const ResolvesFields = require('@lib/crud/Traits/ResolvesFields');
const { spainIdType } = require('spain-id');
const TextField = require('@lib/crud/Fields/Text');
const UID = require('@lib/crud/Fields/UID');
const { validateSpanishId } = require('spain-id');
const { firstPopulated } = require('@api/utils/helpers');

module.exports = class GfClient extends ResolvesFields {
  /**
   * Get the list of fields.
   *
   * @param {Object} request
   * @return {array}
   */
  fields(request) {
    return [
      new ID(),

      new UID('UID', 'uid'),

      new BooleanField('Imported').default(false).exceptOnForms(),

      new BooleanField('Active')
        .default(false)
        .exceptOnForms()
        // .sequelizeSet((value, attribute, model) => {
        //   model.setDataValue(attribute, model.isActive());
        // })
        .resolveUsing((value, resource) => resource.isActive()),

      new BooleanField('Defaulter').default(false).exceptOnForms(),

      new NumberField('Invoice', 'invoiceClientId')
        .nullable()
        .rules('existsOnIntranet:InvoiceClient'),

      new NumberField('Syste User', 'userId')
        .nullable()
        .rules('existsOnSystem:User'),

      new TextField('TPV Code', 'idTpv').nullable(),

      new NumberField('Old Web Id', 'idOldWeb').nullable().exceptOnForms(),
      new NumberField('Phicus Id', 'phicusCustomerId')
        .nullable()
        .exceptOnForms(),

      new NumberField('Collaborator', 'collaboratorId')
        .nullable()
        .rules('existsOnIntranet:GfCollaborator')
        .sequelizeSet((value, attr, model) => {
          model.setDataValue(attr, value || null);
        }),

      new NumberField('Distributor', 'distributorId')
        .nullable()
        .exceptOnForms(),

      new NumberField('Subscriber Type', 'subscriberTypeId')
        .nullable()
        .rules('existsOnIntranet:GfSubscriberType')
        .updateRules(async (value, attribute, fail) => {
          if (Number(value) < 1 && request.resource().isActive()) {
            fail(`${attribute} is required when client is active`);
          }
        }),

      new NumberField('Document Type', 'documentTypeId')
        .nullable()
        .rules('existsOnIntranet:GfDocumentType')
        .updateRules(async (value, attribute, fail) => {
          if (Number(value) < 1 && request.resource().isActive()) {
            fail(`${attribute} is required when client is active`);
          }
        }),

      new NumberField('Marketing Consent Type', 'marketingConsentTypeId')
        .nullable()
        .exceptOnForms(),

      new TextField('Fiscal Id', 'fiscalId')
        .nullable()
        .sequelizeGet((attribute, model) => {
          const value = model.getDataValue(attribute);

          return typeof value === 'string' ? value.trim() : '';
        })
        .sequelizeSet((value, attribute, model) => {
          model.setDataValue(
            attribute,
            typeof value === 'string' ? value.trim() : null,
          );
        })
        .rules(async (value, attribute, fail) => {
          await this.validateFiscalId(request, value, attribute, fail);
        }),

      new TextField('centreCode', 'centreCode').nullable(),

      new BooleanField('requiresFacturae', 'requiresFacturae')
        .nullable()
        .default(false),

      new TextField('Nationality', 'nationalityCode')
        .nullable()
        .rules('existsOnIntranet:Country'),

      new TextField('language')
        .nullable()
        .default('ca')
        .sequelizeSet((value, attribute, model) => {
          model.setDataValue(
            'language',
            firstPopulated([value, 'ca']).toLowerCase(),
          );
        })
        .sequelizeGet((attribute, model) => {
          return firstPopulated([
            model.getDataValue(attribute),
            'ca',
          ]).toLowerCase();
        }),

      new TextField('Name').nullable(),

      new TextField('Contact Name', 'contactName').nullable(),

      new TextField('Contact Family Name', 'contactFamilyName1').nullable(),

      new TextField('Contact Family Name', 'contactFamilyName2').nullable(),

      new DateTime('Birthday').nullable(),

      new NumberField('Document Type', 'contactDocumentTypeId')
        .nullable()
        .rules('existsOnIntranet:GfDocumentType'),

      new TextField('Contact Fiscal Id', 'contactFiscalId').nullable(),

      new TextField('Email Address', 'emailAddress').nullable().rules('email'),

      new BooleanField('Dont Have Email', 'dontHaveEmail').default(false),

      new BooleanField('sendInvoiceMail', 'sendInvoiceMail')
        .nullable()
        .default(false),

      new NumberField('dealtInvoiceAmount', 'dealtInvoiceAmount')
        .nullable()
        .default(0),

      new TextField('Conact Phone', 'contactPhone').nullable(),

      ...this.addressFields(request),

      new TextField('Document').nullable(),
      new TextField('Iban')
        .nullable()
        .sequelizeSet((value, attribute, model) => {
          model.setDataValue(
            'iban',
            value ? value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : null,
          );
        })
        .sequelizeGet((attribute, model) => {
          const value = model.getDataValue(attribute);
          return value
            ? value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
            : null;
        }),
      new TextField('Bic').nullable(),
      new TextField('Bic Name', 'bicName').nullable(),

      new BooleanField('No Billable', 'noBillable').nullable().default(false),
      new BooleanField('Is Remitance', 'isRemitance').nullable().default(false),
      new NumberField('Payment Type', 'paymentTypeId').nullable(),
      new BooleanField('Disable My Goufone', 'myGoufoneDisabled')
        .nullable()
        .default(false),

      new NumberField('Pay Day', 'payDay')
        .nullable()
        .default(0)
        .required()
        .rules('required'),

      ...this.sepaFields(request),

      new BooleanField('Aire Code', 'aireCode').nullable(),
      new TextField('Aire Error', 'lastAireError').nullable(),

      new TextField('Las EXTErp Error', 'lastExtErpError').nullable(),
      new BooleanField('exists_on_lemon').exceptOnForms().default(false),

      new NumberField('Deleted?', 'status')
        .swagger('type', 'number')
        .default(1)
        .exceptOnForms(),

      new DateTime('Creation Date', 'creationDate').exceptOnForms().nullable(),

      new DateTime('Update Date', 'updateDate').exceptOnForms().nullable(),
    ];
  }

  addressFields(request) {
    return [
      new TextField('temporaryAddress', 'temporaryAddress').nullable(),
      new TextField('Region', 'addressRegion').nullable(),

      new TextField('Province', 'addressProvince').nullable(),
      new TextField('Province Code', 'addressProvinceCode').nullable(),
      new TextField('Province Code Name', 'addressProvinceCodeName').nullable(),

      new TextField('City', 'addressCity').nullable(),
      new TextField('City Code', 'addressCityCode').nullable(),
      new TextField('City Code Name', 'addressCityCodeName').nullable(),

      new TextField('PostalCode', 'addressPostalCode').nullable(),
      new TextField('PostalCode Code', 'addressPostalCodeCode').nullable(),
      new TextField(
        'PostalCode Code Name',
        'addressPostalCodeCodeName',
      ).nullable(),

      new TextField('Street', 'addressStreet').nullable(),
      new TextField('Street Code', 'addressStreetCode').nullable(),
      new TextField('Street Code Name', 'addressStreetCodeName').nullable(),

      new TextField('StreetType Code', 'addressStreetTypeCode').nullable(),
      new TextField(
        'StreetType Code Name',
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

      new TextField('Address Latitude', 'addressLat').nullable(),
      new TextField('Address Longitude', 'addressLng').nullable(),
      new TextField('Address Map Url', 'addressMapUrl').nullable(),

      new BooleanField('Google Map', 'useGoogleMaps').default(false),
      new BooleanField('Shipping Address', 'useAdressForShipping').default(
        false,
      ),

      new TextField(
        'Shipping Address Region',
        'shippingAddressRegion',
      ).nullable(),
      new TextField(
        'Shipping Address Province',
        'shippingAddressProvince',
      ).nullable(),
      new TextField('Shipping Address City', 'shippingAddressCity').nullable(),
      new TextField(
        'Shipping Address PostalCode',
        'shippingAddressPostalCode',
      ).nullable(),
      new TextField(
        'Shipping Address Street',
        'shippingAddressStreet',
      ).nullable(),
      new TextField(
        'Shipping Address Number',
        'shippingAddressNumber',
      ).nullable(),
      new TextField(
        'Address Description',
        'shippingAddressDescription',
      ).nullable(),
    ];
  }

  sepaFields(request) {
    return [
      new TextField('Sepa Name', 'sepaName').nullable(),
      new TextField('Sepa Surname1', 'sepaSurname1').nullable(),
      new TextField('Sepa Surname2', 'sepaSurname2').nullable(),
      new TextField('Sepa FiscalId', 'sepaFiscalId').nullable(),
      new NumberField('sepa Fiscal Id', 'sepaFiscalTypeId').nullable(),
    ];
  }

  async validateFiscalId(request, value, attribute, fail) {
    // check fiscalId format
    if (!validateSpanishId(value)) fail('Format is invalid');

    const { GfSubscriberType, GfDocumentType } = models.intranet;

    // Subscriber Types
    // @ts-ignore
    const subscriberTypes = await GfSubscriberType.indexByAireCode();
    const EXTRANGER = subscriberTypes[2];
    const RESIDENCIAL = subscriberTypes[0];
    const EMPRESA = subscriberTypes[1];
    // const AUTONOM = subscriberTypes[5];

    // Document Types
    // @ts-ignore
    const documentTypes = await GfDocumentType.indexByAireCode();

    const DNI = documentTypes[0];
    const NIE = documentTypes[1];
    const CIF = documentTypes[4];
    // const PASSPORT = documentTypes[2];

    const fiscalIdType = spainIdType(value).toUpperCase();

    if (fiscalIdType === 'DNI' && request.input('documentTypeId') !== DNI)
      return fail('fiscalId not matches document type');

    if (
      fiscalIdType === 'DNI' &&
      request.input('subscriberTypeId') !== RESIDENCIAL
    ) {
      return fail('fiscalId not matches subscriber type');
    }

    if (fiscalIdType === 'NIE' && request.input('documentTypeId') !== NIE) {
      return fail('fiscalId not matches document type');
    }

    if (
      fiscalIdType === 'NIE' &&
      request.input('subscriberTypeId') !== EXTRANGER
    ) {
      return fail('fiscalId not matches subscriber type');
    }

    if (fiscalIdType === 'NIF' && request.input('documentTypeId') !== DNI) {
      return fail('fiscalId not matches document type');
    }

    if (
      fiscalIdType === 'NIF' &&
      request.input('subscriberTypeId') !== RESIDENCIAL
    ) {
      return fail('fiscalId not matches subscriber type');
    }

    if (fiscalIdType === 'CIF' && request.input('documentTypeId') !== CIF) {
      return fail('fiscalId not matches document type');
    }

    if (
      fiscalIdType === 'CIF' &&
      request.input('subscriberTypeId') !== EMPRESA
    ) {
      return fail('fiscalId not matches subscriber type');
    }
  }
};
