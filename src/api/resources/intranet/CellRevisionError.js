//@ts-check
'use strict';

const ID = require('@lib/crud/Fields/ID');
const Text = require('@lib/crud/Fields/Text');
const Resource = require('@lib/crud/Resource');
const {
  CellRevisionError: Model,
} = require('@api/models/intranet/intranet_cell_revision_error');
const Enum = require('@lib/crud/Fields/Enum');
const { RevisionGroup } = require('@api/constants/enum');
const { CELL_PROVIDER_CODE } = require('@api/constants/contracts');
const DateTime = require('@lib/crud/Fields/DateTime');
const ResolveProviderFee = require('./actions/ResolveProviderFee');
const { GfClient } = require('@api/models/intranet/intranet_gf_clients');

module.exports = class CellRevisionError extends Resource {
  configureCreateSwagger = false;
  configureDeleteSwagger = false;
  configureUpdateSwagger = false;

  include = [
    {
      model: GfClient,
      required: false,
      attributes: [
        'name',
        'id',
        'fiscalId',
        'contactName',
        'contactFamilyName1',
        'contactFamilyName2',
      ],
    },
  ];

  fields(request) {
    return [
      new ID(),
      new Text('number').sortable().filterable(),
      new Text('fiscal_id').sortable().filterable(),
      new Text('fee').sortable().filterable(),
      new Enum('group').from(RevisionGroup).sortable().filterable(),
      new Enum('provider').from(CELL_PROVIDER_CODE).sortable().filterable(),

      new Text('error'),
      new DateTime('create_at'),
    ];
  }

  /**
   * Get the resource model name.
   *
   * @returns {function}
   */
  model() {
    return Model;
  }

  /**
   * Get the list of the resource actions.
   *
   * @return {array}
   */
  actions() {
    return [new ResolveProviderFee()];
  }
};
