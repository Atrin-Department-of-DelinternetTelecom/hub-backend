import { PDFDocument, PDFPageDrawImageOptions } from 'pdf-lib';

import { Renderer } from './Renderer';
import { S3 } from '@lib/cache';
import { kebabCase } from 'lodash';

export abstract class PdfRenderer extends Renderer {
  abstract getTitle(): string;
  abstract filenamePrefix: string;
  onlyUpload = false;

  getPdfName() {
    return kebabCase(this.storage.title);
  }

  async getTemplate(): Promise<Buffer> {
    return S3.sear(await this.getRenderHash(), async () => {
      return this.getDocumentFromProvider();
    });
  }

  async getRendered() {
    const file = await this.getTemplate();
    const doc = await PDFDocument.load(file);
    const signatures = await this.getSignatures();

    for (const signature in signatures) {
      if (!Buffer.isBuffer(signatures[signature])) {
        continue;
      }

      const signatureImg = await doc.embedPng(signatures[signature]);
      const signInfo = this.signInfo(signature);

      let pageNumber = 1;
      for (const page of doc.getPages()) {
        if (
          signInfo.pages.length === 0 ||
          signInfo.pages.includes(pageNumber)
        ) {
          page.drawImage(signatureImg, signInfo.options);
        }
        pageNumber = pageNumber + 1;
      }
    }

    return {
      pdf: Buffer.from(await doc.save()),
    };
  }

  async uploadToProvider(userId: number, pdf: Buffer) {
    return this;
  }

  abstract getSignatures(): Promise<Record<string, Buffer>>;
  abstract getDocumentFromProvider(): Promise<Buffer>;
  abstract signInfo(signature: string): {
    pages: number[];
    options: PDFPageDrawImageOptions;
  };
}
