import * as s3 from '@lib/s3';

import type { DocumentStorage, UpdatableParams } from './Storage';

import { Document } from '@models/global/global_document';
import { errors } from '@api/http/http_errors';
import { getDocumentForStorageType } from '../documents';
import { kebabCase } from 'lodash';

const BUCKET_NAME = 'signatures-bucket';

export class DelinternetStorage implements DocumentStorage {
  #doc: Document;

  get id() {
    return this.#doc.id;
  }

  get type() {
    return this.#doc.type;
  }

  get title() {
    return this.#doc.title;
  }

  get signed() {
    return this.#doc.signed;
  }

  get renderHash() {
    return this.#doc.render_hash;
  }

  get baseDataComplete() {
    return this.#doc.baseDataComplete;
  }

  get createdAt() {
    return this.#doc.createdAt;
  }

  get baseDataCompleteInfo() {
    return null;
  }

  get allSignaturesUploaded() {
    return this.#doc.isSignatureUploaded;
  }

  get signatureUploadedDate() {
    return this.#doc.signatureUploadDate;
  }

  get alreadyRendered() {
    // ignore
    return false;
  }

  #format(name = 'default') {
    return `${this.id.toString()}-${kebabCase(name)}.png`;
  }

  async setSignature(image: Buffer, name: string): Promise<void> {
    const document = getDocumentForStorageType(this.type);
    if (!document.signatures.includes(name)) {
      throw new Error(
        `Signature ${name} is not a valid sign name for this document type`,
      );
    }

    await s3.upload(BUCKET_NAME, this.#format(name), image);

    const isSingleSignDocument = document.signatures.length === 1;
    const allSignsUploaded = isSingleSignDocument
      ? true
      : await this.#isAllSignsUploaded();

    await this.#doc.update({
      isSignatureUploaded: allSignsUploaded,
      signatureUploadDate: allSignsUploaded ? new Date() : null,
    });
  }

  async deleteSignature(name: string) {
    await s3.remove(BUCKET_NAME, this.#format(name));
    await this.#doc.update({
      isSignatureUploaded: false,
      signatureUploadDate: null,
    });
  }

  async getSignature(name: string): Promise<Buffer | null> {
    return s3.download(BUCKET_NAME, this.#format(name));
  }

  async getAllSignatures() {
    const document = getDocumentForStorageType(this.type);

    const entries = await Promise.all(
      document.signatures.map(
        async (signName): Promise<[string, Buffer | null]> => [
          signName,
          await this.getSignature(signName),
        ],
      ),
    );

    return Object.fromEntries(entries);
  }

  async deletePdfDocument() {}

  async storePdfDocument(): Promise<void> {}

  async getPdfDocument(): Promise<null> {
    return null;
  }

  async update(params: Partial<UpdatableParams>) {
    await this.#doc.update({
      title: params.title,
      render_hash: params.renderHash,
      baseDataComplete: params.baseDataComplete,
      signatureUploadDate: params.signatureUploadedDate,
      signed: params.signed,
      isSignatureUploaded: params.isSignatureUploaded,
    });
  }

  async #isAllSignsUploaded() {
    const signs = await this.getAllSignatures();
    for (const [_, sign] of Object.entries(signs)) {
      if (!sign) return false;
    }

    return true;
  }

  static async load(id: number) {
    const doc = await Document.findByPk(id);
    if (!doc) throw new errors.NotFound(`Document with id:${id} not found`);

    return new DelinternetStorage(doc);
  }

  static async create(storageType: string, creatorId: number) {
    const document = getDocumentForStorageType(storageType);

    const doc = await Document.create({
      type: storageType,
      creatorId,
      title: document.initTitle,
      signed: false,
      baseDataComplete: true,
      isSignatureUploaded: false,
    });
    return new DelinternetStorage(doc);
  }
  private constructor(doc: Document) {
    this.#doc = doc;
  }
}
