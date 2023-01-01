import { AnyModel, intranet } from '@api/models';

import { Aire } from '@lib/sdk';
import { DelinternetStorage } from '../storages/DelinternetStorage';
import { Document } from '../document';
import { DocumentStorage } from '../storages/Storage';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GfContractDataCell } from '@api/models/intranet/intranet_gf_contract_data_cell';
import { GfFeeGroup } from '@api/models/intranet/intranet_gf_fee_groups';
import { GfSection } from '@api/models/intranet/intranet_gf_sections';
import { PdfRenderer } from '../renderers/PdfRenderer';
import assert from 'assert';
import { md5 } from '../utils';

const { GfContract, GfContractHolderChange } = intranet;

async function loadDetail(storage: DocumentStorage) {
  const changeHolder = await GfContractHolderChange.findOne({
    where: {
      docId: storage.id,
    },
    include: [
      {
        model: GfClient,
        as: 'fromClient',
      },
      {
        model: GfClient,
        as: 'toClient',
      },
    ],
  });
  assert(changeHolder);

  const contract = await GfContract.findByPk(changeHolder.contractId, {
    include: [
      {
        model: GfFeeGroup,
        as: 'fee_group',
        include: [
          {
            model: GfSection,
            as: 'sections',
            required: true,
          },
        ],
        required: true,
      },
    ],
  });
  assert(contract);

  const section = contract.fee_group?.sections[0];

  return {
    changeHolder: {
      id: changeHolder.id,
      state: changeHolder.state,
    },
    contract: {
      id: contract.id,
      reference: contract.reference,
      state: contract.state,
      type: section.code,
      clientId: contract.clientId,
    },
    fromClient: {
      id: changeHolder.fromClient.id,
      name: changeHolder.fromClient.name,
    },
    toClient: {
      id: changeHolder.toClient.id,
      name: changeHolder.toClient.name,
    },
  };
}

class ChangeAireHolderRenderer extends PdfRenderer {
  changeHolder!: AnyModel;
  filenamePrefix = 'change_aire_holder';
  signs: {
    toClient?: Buffer;
    fromClient?: Buffer;
  } = {};

  async getDocumentFromProvider(): Promise<Buffer> {
    return Aire.downloadDocument({
      code: this.changeHolder.provider_tracking_code,
      documentType: 'CONTRATO',
    });
  }

  getPdfName(): string {
    return `change-holder-${this.changeHolder.id}.pdf`;
  }

  async loadProps() {
    const changeHolder = await GfContractHolderChange.findOne({
      where: {
        docId: this.storage.id,
      },
      include: [
        {
          model: GfClient,
          as: 'fromClient',
        },
        {
          model: GfClient,
          as: 'toClient',
        },
        {
          model: GfContract,
          as: 'contract',
          required: false,
          include: [
            {
              model: GfContractDataCell,
              as: 'dataCell',
            },
          ],
        },
      ],
    });
    assert(changeHolder);

    this.changeHolder = changeHolder;
  }

  getTitle() {
    return `AIRE Change Holder`;
  }

  async getSignatures() {
    return {
      toClient: (await this.storage.getSignature('toClient'))!,
      fromClient: (await this.storage.getSignature('fromClient'))!,
    };
  }

  signInfo(signature: string) {
    return signature === 'fromClient'
      ? {
          pages: [2],
          options: {
            x: 425,
            y: 180,
            width: 100,
            height: 100,
          },
        }
      : {
          pages: [],
          options: {
            x: 90,
            y: 35,
            width: 100,
            height: 100,
          },
        };
  }

  getRenderHash(): string | Promise<string> {
    return md5(`${this.changeHolder.id}-${this.changeHolder.updateDate}`);
  }
}

export default new Document({
  type: 'change_aire_holder',
  storageType: 'Goufone-Documents-ChangeAireHolder',
  initTitle: 'Change Holder',
  signatures: ['toClient', 'fromClient'],
  cellType: 'CONTRATO',
  loadDetail,
  Storage: DelinternetStorage,
  Renderer: ChangeAireHolderRenderer,
});
