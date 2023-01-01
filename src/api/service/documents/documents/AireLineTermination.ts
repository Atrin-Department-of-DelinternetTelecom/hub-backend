import { Aire } from '@lib/sdk';
import { DelinternetStorage } from '../storages/DelinternetStorage';
import { Document } from '../document';
import { DocumentStorage } from '../storages/Storage';
import { PdfRenderer } from '../renderers/PdfRenderer';
import { SuspendingAction } from '@api/models/global/global_suspending_action';
import assert from 'assert';
import { md5 } from '../utils';

async function loadDetail(storage: DocumentStorage) {
  const suspendingAction = await SuspendingAction.findOne({
    where: { doc_id: storage.id },
  });
  assert(suspendingAction);

  return {
    suspendingAction: {
      id: suspendingAction.id,
      contractId: suspendingAction.gf_contract_id,
    },
  };
}

class AireLineTerminationRenderer extends PdfRenderer {
  suspendingAction!: SuspendingAction;
  filenamePrefix = 'aire_line_termination';
  signs: { client?: Buffer } = {};

  async getDocumentFromProvider(): Promise<Buffer> {
    return Aire.downloadDocument({
      code: this.suspendingAction.provider_tracking_code,
      documentType: 'CONTRATO',
    });
  }

  getPdfName(): string {
    return `aire-line-termination-${this.suspendingAction.id}.pdf`;
  }

  async loadProps() {
    const suspendingAction = await SuspendingAction.findOne({
      where: { doc_id: this.storage.id },
    });
    assert(suspendingAction);

    this.suspendingAction = suspendingAction;
  }

  getTitle() {
    return `AIRE Line Termination`;
  }

  async getSignatures() {
    return {
      client: (await this.storage.getSignature('client'))!,
    };
  }

  signInfo() {
    return {
      pages: [],
      options: {
        x: 90,
        y: 70,
        width: 100,
        height: 100,
      },
    };
  }

  getRenderHash(): string | Promise<string> {
    return md5(
      `${this.suspendingAction.id}-${this.suspendingAction.created_at}`,
    );
  }
}

export default new Document({
  type: 'aire_line_termination',
  storageType: 'Documents-AireLineTermination',
  initTitle: 'Aire Termination',
  signatures: ['client'],
  cellType: 'CONTRATO',
  loadDetail,
  Storage: DelinternetStorage,
  Renderer: AireLineTerminationRenderer,
});
