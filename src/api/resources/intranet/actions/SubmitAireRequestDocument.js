//@ts-check
'use strict';
const { intranet } = require('@api/models');
const { GfClient } = require('@api/models/intranet/intranet_gf_clients');
const Action = require('@lib/crud/FormDataAction');
const Select = require('@lib/crud/Fields/Select');
const File = require('@lib/crud/Fields/File');
const { Aire } = require('@lib/sdk');
const assert = require('assert');

module.exports = class SubmitAireRequestDocument extends Action {
  constructor(...args) {
    super(...args);
    this.direct();
  }

  /**
   * Prepare field for json.
   *
   * @param {Object} request
   * @param {Array} models
   * @param {document_type: string} fields
   * @return {Promise<Object>}
   */
  async handle(request, models, fields) {
    const aireRequest = models[0];
    console.log('aireRequest', aireRequest);
    const client = await GfClient.findOne({
      where: { fiscalId: aireRequest.fiscal_id },
      include: {
        model: intranet.GfSubscriberType,
        as: 'subscriberType',
      },
    });

    assert(client, `Client with fiscalId ${aireRequest.fiscal_id} not found`);

    // Access uploaded file from express-fileupload
    const uploadedFile = request.files?.document;
    assert(uploadedFile, 'No file uploaded');

    const fileName = uploadedFile.name;
    const base64File = uploadedFile.data.toString('base64');

    await Aire.uploadDocument({
      subscriberType: client.subscriberType.aireNetworksCode,
      fiscalId: client.fiscalId,
      aireRequestCode: aireRequest.code,
      documentType: fields.document_type,
      file: base64File,
      fileName,
    });
  }

  fields() {
    return [
      new Select('document_type').required().default('DOCUMENTO').options({
        PORTABILIDAD: 'PORTABILIDAD',
        CONTRATO: 'CONTRATO',
        DOCUMENTO: 'DOCUMENTO',
        BAJA: 'BAJA',
        OTROS: 'OTROS',
      }),

      new File('document'),
    ];
  }
};
