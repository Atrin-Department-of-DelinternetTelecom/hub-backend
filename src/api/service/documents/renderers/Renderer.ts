import type { DocumentStorage, UpdatableParams } from '../storages/Storage';
import type { CachePackage, PdfInfo } from '../types';
import { convertPartialPackToCompletePack } from '../Package';

export abstract class Renderer {
  storage!: DocumentStorage;

  abstract getRendered(): Promise<{
    pdf: Buffer;
    images?: Buffer[];
    thumb?: Buffer;
  }>;
  abstract getRenderHash(): string | Promise<string>;

  abstract onlyUpload: boolean;
  abstract getPdfName(): string;
  abstract loadProps(): Promise<void>;

  constructor(storage: DocumentStorage) {
    this.storage = storage;
  }

  async load() {
    await this.loadProps();

    const updateParams: Partial<UpdatableParams> = {
      ...this.#baseData(),
    };

    const title = this.getTitle();
    if (title) updateParams.title = title;

    await this.storage.update(updateParams);
  }

  getTitle(): string | undefined {
    return undefined;
  }

  checkBaseDataIsComplete(): true | string {
    return true;
  }

  #baseData() {
    const result = this.checkBaseDataIsComplete();

    if (result === true) {
      return {
        baseDataComplete: true,
        baseDataCompleteInfo: null,
      };
    }

    return {
      baseDataComplete: false,
      baseDataCompleteInfo: result,
    };
  }

  async getRenderedPackage(): Promise<CachePackage> {
    const newHash = await this.getRenderHash();
    const cachedPdf = await this.storage.getPdfDocument();
    const cachedHash = this.storage.renderHash;
    const pdfName = this.getPdfName();

    if (cachedPdf && newHash === cachedHash) {
      return convertPartialPackToCompletePack({
        pdf: cachedPdf.file,
        pdfName,
        info: cachedPdf.info!,
        hash: this.storage.renderHash!,
      });
    }

    const { pdf, images, thumb } = await this.getRendered();

    const pack = await convertPartialPackToCompletePack({
      pdf,
      pdfName,
      hash: newHash,
      images,
      thumb,
    });

    if (this.storage.signed) {
      await this.#renewGeneratedPdf(pack.pdf, pack.info);
    }

    await this.storage.update({
      renderHash: newHash,
    });

    return pack;
  }

  /**
   * delete old generated pdf and store a new one if possible. maybe the storage is readonly so you should handle it.
   */
  async #renewGeneratedPdf(pdf: Buffer, pdfInfo: PdfInfo) {
    try {
      await this.storage.deletePdfDocument();
    } catch (e) {
      console.warn(e);
    }

    try {
      await this.storage.storePdfDocument({ file: pdf, info: pdfInfo });
    } catch (e) {
      console.warn(e);
    }
  }
}
