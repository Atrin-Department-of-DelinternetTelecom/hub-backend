export interface SignCoordinate {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SignInfo {
  pages: 'all' | number[]; // started from 1
  coordinate: SignCoordinate;
}

export interface CellProvider {
  name: 'aire' | 'lemon';

  downloadContract(): Promise<Buffer>;
  contractSignInfo: SignInfo;

  downloadPortability(): Promise<Buffer>;
  portabilitySignInfo: SignInfo;

  uploadContract(filename: string, pdf: Buffer): Promise<void>;
  uploadPortability(filename: string, pdf: Buffer): Promise<void>;
}
