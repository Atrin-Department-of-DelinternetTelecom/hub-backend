import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { lemon } from '@lib/lemon';
import assert from 'assert';
import { Blob } from 'node:buffer';
import { Readable } from 'node:stream';
import consumers from 'node:stream/consumers';
import { ReadableStream } from 'node:stream/web';
import { isValidPdf } from '../utils';
import { CellProvider, SignInfo } from './type';

interface Contract {
  clientId: number;
  dataCell: {
    number: string;
    portability: 0 | 1;
    providerRequestCode: string;
  };
}

interface Client {
  id: number;
  fiscalId: string;
}

const signInfo: SignInfo = {
  pages: [1, 2, 3],
  coordinate: {
    x: 400,
    y: 85,
    width: 75,
    height: 75,
  },
};

export class LemonProvider implements CellProvider {
  #contract: Contract;
  #client: Client;
  private constructor(contract: Contract, client: Client) {
    this.#contract = contract;
    this.#client = client;
  }

  name = 'lemon' as const;

  /**
   * lemon has a single method to both regular contract document and portability
   */
  async #upload(filename: string, pdf: Buffer): Promise<void> {
    await lemon.contract.uploadContract({
      archivo: new Blob([pdf]),
      fiscalId: this.#client.fiscalId,
      telefono: this.#contract.dataCell.number,
    });
  }
  /**
   * lemon has a single method to both regular contract document and portability
   */
  async #download(): Promise<Buffer> {
    const result = (
      await lemon.contract.downloadContract({
        fiscalId: this.#client.fiscalId,
        telefono: this.#contract.dataCell.number,
      })
    ).data;

    const readable: ReadableStream<Uint8Array> = result.file;
    const pdf = await consumers.buffer(Readable.fromWeb(readable));

    assert(
      isValidPdf(pdf),
      'fetching document from lemon failed: result is not a valid pdf',
    );

    return pdf;
  }

  async uploadContract(filename: string, pdf: Buffer): Promise<void> {
    if (this.#contract.dataCell.portability) {
      throw new Error('This lemon contract only has portability document');
    }

    return this.#upload(filename, pdf);
  }

  async downloadContract(): Promise<Buffer> {
    if (this.#contract.dataCell.portability) {
      throw new Error('This lemon contract only has portability document');
    }

    return this.#download();
  }

  async uploadPortability(filename: string, pdf: Buffer): Promise<void> {
    if (!this.#contract.dataCell.portability) {
      throw new Error('This lemon contract does not have portability document');
    }

    return this.#upload(filename, pdf);
  }

  async downloadPortability(): Promise<Buffer> {
    if (!this.#contract.dataCell.portability) {
      throw new Error('This lemon contract does not have portability document');
    }

    return this.#download();
  }

  contractSignInfo = signInfo;
  portabilitySignInfo = signInfo;

  static async load(contract: Contract) {
    const client = await GfClient.findByPk(contract.clientId);

    assert(client, `Client with id:${contract.clientId} not found`);

    return new LemonProvider(contract, client);
  }
}
