import { CellProvider, SignInfo } from './type';

import { Aire } from '@lib/sdk';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import assert from 'assert';
import { intranet } from '@api/models';
import { isValidPdf } from '../utils';

const { GfSubscriberType } = intranet;

interface Contract {
  clientId: number;
  dataCell: {
    providerRequestCode: string;
  };
}

interface Client {
  id: number;
  fiscalId: string;
  subscriberType: {
    aireNetworksCode: string;
  };
}

const signInfo: SignInfo = {
  pages: 'all',
  coordinate: {
    x: 80,
    y: 50,
    width: 150,
    height: 150,
  },
};

export class AireProvider implements CellProvider {
  #contract: Contract;
  #client: Client;
  #providerRequestCode: string | null;
  private constructor(contract: Contract, client: Client) {
    this.#contract = contract;
    this.#client = client;
    this.#providerRequestCode = contract.dataCell.providerRequestCode;
  }

  name = 'aire' as const;

  #assertProviderRequestCode() {
    assert(this.#providerRequestCode, 'Missing Aire providerRequestCode');
  }

  uploadContract(filename: string, pdf: Buffer): Promise<void> {
    this.#assertProviderRequestCode();

    return Aire.uploadDocument({
      subscriberType: this.#client.subscriberType.aireNetworksCode,
      fiscalId: this.#client.fiscalId,
      aireRequestCode: this.#providerRequestCode!,
      documentType: 'CONTRATO',
      fileName: filename,
      file: pdf,
    });
  }

  uploadPortability(filename: string, pdf: Buffer): Promise<void> {
    this.#assertProviderRequestCode();

    return Aire.uploadDocument({
      subscriberType: this.#client.subscriberType.aireNetworksCode,
      fiscalId: this.#client.fiscalId,
      aireRequestCode: this.#providerRequestCode!,
      documentType: 'PORTABILIDAD',
      fileName: filename,
      file: pdf,
    });
  }

  async downloadContract(): Promise<Buffer> {
    const pdf = await Aire.downloadDocument({
      code: this.#contract.dataCell.providerRequestCode,
      documentType: 'CONTRATO',
    });

    assert(
      isValidPdf(pdf),
      'fetching document from aire failed: result is not a valid pdf',
    );

    return pdf;
  }

  contractSignInfo = signInfo;

  async downloadPortability(): Promise<Buffer> {
    const pdf = await Aire.downloadDocument({
      code: this.#contract.dataCell.providerRequestCode,
      documentType: 'PORTABILIDAD',
    });

    assert(
      isValidPdf(pdf),
      'fetching document from aire failed: result is not a valid pdf',
    );

    return pdf;
  }

  portabilitySignInfo = signInfo;

  static async load(contract: Contract) {
    const client = await GfClient.findByPk(contract.clientId, {
      include: [
        {
          model: GfSubscriberType,
          as: 'subscriberType',
          required: true,
        },
      ],
    });

    assert(client, `Client with id:${contract.clientId} not found`);

    return new AireProvider(contract, client as any);
  }
}
