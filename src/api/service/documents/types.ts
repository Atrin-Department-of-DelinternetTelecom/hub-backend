import { Binary } from 'bson';
import { DocumentStorage } from './storages/Storage';
import { Renderer } from './renderers/Renderer';

export type RendererConstructor = {
  signatures?: string[];
  new (storage: DocumentStorage): Renderer;
};

export interface PdfInfo {
  Pages: string; // numeric string
}

export interface Pdf {
  file: Buffer;
  info: PdfInfo;
}

export interface CachePackage {
  hash: string;
  pdf: Buffer;
  pdfName: string;
  info: PdfInfo;
  thumb: Buffer;
  images: Buffer[];
}

export interface PartialCachePackage {
  hash: string;
  pdf: Buffer;
  pdfName: string;
  info?: PdfInfo;
  thumb?: Buffer;
  images?: Buffer[];
}

export interface CachePackageBson {
  hash: string;
  pdf: Binary;
  pdfName: string;
  info: PdfInfo;
  thumb: Binary;
  images: Binary[];
}

export interface DocumentView {
  id: string;
  createdAt: Date;
  title: string;
  type: string;
  documentType: string;
  signed: boolean;
  baseDataComplete: boolean;
  baseDataCompleteInfo: string | null;
  isSignatureUploaded: boolean;
}

export type DocumentExtendedView = DocumentView & {
  signatures: string[];
  detail: unknown;
};
