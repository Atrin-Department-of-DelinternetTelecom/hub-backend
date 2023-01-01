/** This file only has ts types */
import { Pdf } from '../types';

export interface UpdatableParams {
  title: string;
  signed: boolean;
  renderHash: string | null;
  baseDataComplete: boolean;
  baseDataCompleteInfo: string | null;
  signatureUploadedDate: Date | null;
  isSignatureUploaded: boolean;
}

export interface DocumentStorage {
  readonly id: number;
  readonly type: string;
  readonly title: string;
  readonly signed: boolean;
  readonly renderHash: string | null;
  readonly allSignaturesUploaded: boolean;
  readonly baseDataComplete: boolean;
  readonly baseDataCompleteInfo: string | null;
  readonly signatureUploadedDate: Date | null;
  readonly alreadyRendered: boolean;
  readonly createdAt: Date;

  setSignature(image: Buffer, name: string): Promise<void>;
  getSignature(name: string): Promise<Buffer | null>;
  getAllSignatures(): Promise<Record<string, Buffer | null>>;

  storePdfDocument(pdf: Pdf): Promise<void>;
  getPdfDocument(): Promise<Pdf | null>;
  deletePdfDocument(): Promise<void>;

  // to save the changes
  update(params: Partial<UpdatableParams>): Promise<void>;
}
