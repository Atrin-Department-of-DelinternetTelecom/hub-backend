//@ts-check
'use strict';
const { default: Download } = require('@api/http/Responses/Download');
const Action = require('@lib/crud/Action');
const Text = require('@lib/crud/Fields/Text');
const { Aire } = require('@lib/sdk');

module.exports = class RetrieveAireRequestDocument extends Action {
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
  async handle(request, models) {
    const aireRequest = models[0];
    const documentId = request.swagger.params.documentId.value;

    const doc = await Aire.downloadRequestDocument({
      code: aireRequest.code,
      documentId: documentId,
    });

    return new Download(doc, `${aireRequest.code}-${documentId}.pdf`);
  }

  /**
   * Prepare resource for swager config.
   *
   * @param {Object} request
   * @param {Object} resource
   * @return {Object}
   */
  swaggerConfig(request, resource) {
    const config = super.swaggerConfig(request, resource);

    return {
      ...config,
      parameters: [
        {
          in: 'path',
          name: 'documentId',
          required: true,
          type: 'string',
          description: 'The ID of the document to retrieve',
        },
      ],
    };
  }

  swaggerResponse() {
    return this.downloadResponse();
  }

  /**
   * Request call method.
   *
   * @return {string}
   */
  swaggerMethod() {
    return 'get';
  }

  /**
   * Request path.
   *
   * @return {string}
   */
  swaggerRoute() {
    return `actions/${this.uriKey()}/{documentId}`;
  }
};
