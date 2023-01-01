import { AireUploadHistory } from '@api/models/intranet/intranet_aire_upload_history';
import { CellProvider } from '../CellProviders/type';
import { CellProviderLoader } from '../CellProviders/Loader';
import { DateTime } from 'luxon';
import { PDFDocument } from 'pdf-lib';
import { Renderer } from './Renderer';
import { S3 } from '@lib/cache';
import assert from 'assert';
import { assertGfStorage } from '../storages/GfDocStorage';
import crypto from 'crypto';
import { errors } from '@api/http/http_errors';
import { firstPopulated } from '@api/utils/helpers';
import { getDocumentForStorageType } from '../documents';
import { intranet } from '@models';
import { kebabCase } from 'lodash';
import to from 'await-to-js';

const { GfContract, GfContractDataCell } = intranet;

const md5 = (v: Buffer | string) =>
  crypto.createHash('md5').update(v).digest('hex');

export abstract class CellPdfRenderer extends Renderer {
  abstract getTitle(): string;
  abstract filenamePrefix: string;

  onlyUpload = false;

  signature: Buffer | null = null;
  dataCell!: {
    number: string;
    providerRequestCode: string;
  };
  cellProvider!: CellProvider;

  #cellType(): 'PORTABILIDAD' | 'CONTRATO' {
    const { cellType } = getDocumentForStorageType(this.storage.type);
    assert(cellType);
    return cellType;
  }

  async loadProps() {
    this.signature = await this.storage.getSignature('default');
    assertGfStorage(this.storage);
    const { clientId, contractId } = this.storage.gfDoc;
    assert(contractId);

    const contract = await GfContract.findByPk(contractId, {
      include: [
        {
          model: GfContractDataCell,
          as: 'dataCell',
          required: true,
        },
      ],
    });
    assert(contract, `Contract with id:${contractId} not found`);

    this.cellProvider = await CellProviderLoader.load(contractId);
    this.dataCell = contract.dataCell;
  }

  getPdfName() {
    return kebabCase(this.storage.title);
  }

  async getTemplate(): Promise<Buffer> {
    return S3.sear(
      this.#temporaryFileName(),
      async () => this.#getDocumentFromProvider(),
      60 * 24 * 60 * 60,
    );
  }

  async getRendered() {
    const file = await this.getTemplate();

    if (!this.signature) {
      return { pdf: file };
    }

    const doc = await PDFDocument.load(file);

    const pages = doc.getPages();
    const signatureImg = await doc.embedPng(this.signature);
    const signInfo = this.#getProviderSignInfo();

    let pageNumber = 1;
    for (const page of pages) {
      if (signInfo.pages === 'all' || signInfo.pages.includes(pageNumber)) {
        page.drawImage(signatureImg, signInfo.coordinate);
      }
      pageNumber = pageNumber + 1;
    }

    return {
      pdf: Buffer.from(await doc.save()),
    };
  }

  getRenderHash() {
    const info = this.#getTemplateRenderInfo();
    const hasSignature = !!this.signature;
    return md5(`${info}-${hasSignature}`);
  }

  #getTemplateRenderInfo(): string {
    const { providerRequestCode, number } = this.dataCell;
    const code = providerRequestCode || number;
    if (!code) {
      throw new errors.BadRequest('no providerRequestCode or number');
    }

    const type = this.#cellType();
    // we are not returning md5 hash here to avoid extra hashing.
    return type + '-' + code;
  }

  async uploadToProvider(userId: number, pdf: Buffer) {
    assertGfStorage(this.storage);
    const { gfDoc } = this.storage;

    assert(pdf, 'pdf not found');

    const filename = firstPopulated([gfDoc.file, `${gfDoc.assetName()}.pdf`]);

    const [error] = await to(
      this.#cellType() == 'CONTRATO'
        ? this.cellProvider.uploadContract(filename, pdf)
        : this.cellProvider.uploadPortability(filename, pdf),
    );

    await AireUploadHistory.create({
      success: error === null,
      error: error?.message,
      document_id: gfDoc.id,
      user_id: userId,
      uploaded_at: DateTime.now().toSQL(),
    });

    if (error) {
      throw error;
    }

    return this;
  }

  async #getDocumentFromProvider() {
    const pdf =
      this.#cellType() === 'CONTRATO'
        ? await this.cellProvider.downloadContract()
        : await this.cellProvider.downloadPortability();

    return pdf;
  }

  #temporaryFileName() {
    const { providerRequestCode, number } = this.dataCell;
    const code = providerRequestCode || number;
    if (!code) {
      throw new errors.BadRequest('no providerRequestCode or number');
    }
    return `${this.filenamePrefix}_${code}.pdf`;
  }

  #getProviderSignInfo() {
    return this.#cellType() === 'CONTRATO'
      ? this.cellProvider.contractSignInfo
      : this.cellProvider.portabilitySignInfo;
  }
}
