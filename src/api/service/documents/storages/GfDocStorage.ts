import * as s3 from '@lib/s3';

import type { DocumentStorage, UpdatableParams } from './Storage';

import { DocStatus } from '@models/intranet/intranet_docs_status';
import { GfDoc } from '@models/intranet/intranet_gf_docs';
import type { Pdf } from '../types';
import assert from 'assert';
import { errors } from '@api/http/http_errors';
import { kebabCase } from 'lodash';

const BUCKET_NAME = 'gf-doc-signatures';
export class GfDocStorage implements DocumentStorage {
  supportsMultiSignatures = false as const;
  #doc: GfDoc;
  #docStatus: DocStatus;
  #onlyUpload: boolean;

  get id() {
    return this.#doc.id;
  }

  get type() {
    return this.#doc.type;
  }

  get title() {
    return this.#docStatus.title ?? '';
  }

  get signed() {
    return this.#docStatus.signed;
  }

  get renderHash() {
    return this.#docStatus.renderHash;
  }

  get baseDataComplete() {
    return this.#docStatus.baseDataComplete;
  }

  get allSignaturesUploaded() {
    return !!this.#docStatus.signatureUploadedDate;
  }

  get baseDataCompleteInfo() {
    return toStandardBaseDataCompleteInfo(this.#docStatus);
  }

  get signatureUploadedDate() {
    return this.#docStatus.signatureUploadedDate;
  }

  get alreadyRendered() {
    return !!this.#doc.filePath();
  }

  get gfDoc() {
    return this.#doc;
  }

  get docStatus() {
    return this.#docStatus;
  }

  get createdAt() {
    return this.#doc.creationDate;
  }

  #assertPermission() {
    if (this.#onlyUpload) throw new Error('Only upload');
  }

  #format(name = 'default') {
    return `gf-docs-${this.id.toString()}-${kebabCase(name)}.png`;
  }

  async setSignature(image: Buffer, name: string): Promise<void> {
    this.#assertPermission();

    assert(
      name === 'default',
      `GfDocStorage only supports 'default' sign. can't get '${name}' sign`,
    );

    const imageName = this.#format(name);

    await s3.upload(BUCKET_NAME, imageName, image);

    await this.#docStatus.update({
      imageSignature: imageName,
      signatureUploadedDate: new Date(),
    });
  }

  async deleteSignature(name: string) {
    assert(
      name === 'default',
      `GfDocStorage only supports 'default' sign. can't get '${name}' sign`,
    );

    await s3.remove(BUCKET_NAME, this.#format(name));
    await this.#doc.update({
      isSignatureUploaded: false,
      signatureUploadDate: null,
    });
  }

  async getSignature(name: string): Promise<Buffer | null> {
    assert(
      name === 'default',
      `GfDocStorage only supports 'default' sign. can't get '${name}' sign`,
    );

    return s3.download(BUCKET_NAME, this.#format(name));
  }

  async getAllSignatures(): Promise<Record<string, Buffer | null>> {
    return {
      default: await this.getSignature('default'),
    };
  }

  async deletePdfDocument() {}

  async storePdfDocument({ file, info }: Pdf): Promise<void> {}

  async getPdfDocument(): Promise<Pdf | null> {
    return null;
  }

  async update(params: Partial<UpdatableParams>) {
    await this.#docStatus.update({
      title: params.title,
      signed: params.signed,
      renderHash: params.renderHash,
      baseDataComplete: params.baseDataComplete,
      baseDataCompleteInfo: params.baseDataCompleteInfo,
      signatureUploadedDate: params.signatureUploadedDate,
    });
  }

  static async load(gfDocId: number) {
    const doc = await GfDoc.findByPk(gfDocId);
    if (!doc) throw new errors.NotFound(`GfDoc with id:${gfDocId} not found`);

    const [docStatus] = await DocStatus.findOrCreate({
      where: {
        type: doc.type ?? null,
        typeId: doc.id ?? null,
      },
      defaults: {
        signed: doc.file ? 1 : 0,
        onlyUpload: 0,
        renderHash: null,
        baseDataComplete: 1,
        baseDataCompleteInfo: '',
      },
    });

    return new GfDocStorage(doc, docStatus, false);
  }

  static loadFromModelInstance(
    doc: GfDoc,
    docStatus: DocStatus,
    onlyUpload: boolean,
  ) {
    return new GfDocStorage(doc, docStatus, false);
  }

  private constructor(doc: GfDoc, docStatus: DocStatus, onlyUpload: boolean) {
    this.#doc = doc;
    this.#docStatus = docStatus;
    this.#onlyUpload = onlyUpload;
  }
}

export function assertGfStorage(s: DocumentStorage): asserts s is GfDocStorage {
  if (!(s instanceof GfDocStorage)) {
    throw new Error(`Goufone document storage required for this action`);
  }
}

export const toStandardBaseDataCompleteInfo = (docStatus: DocStatus) => {
  const info = docStatus.baseDataCompleteInfo;
  if (!info) return null;
  if (typeof info === 'string') return info;
  if (info.success) return null;
  return info.reason;
};
