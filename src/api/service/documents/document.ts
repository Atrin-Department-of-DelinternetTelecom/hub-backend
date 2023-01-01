import { Renderer } from './renderers/Renderer';
import { DelinternetStorage } from './storages/DelinternetStorage';
import { GfDocStorage } from './storages/GfDocStorage';
import { DocumentStorage } from './storages/Storage';

export interface DocumentCtorParams {
  type: string;
  storageType: string;
  Renderer: { new (storage: DocumentStorage): Renderer };
  Storage: typeof DelinternetStorage | typeof GfDocStorage;
  initTitle: string;
  signatures: string[];
  loadDetail?: (storage: DocumentStorage) => Promise<unknown>;
  cellType?: 'CONTRATO' | 'PORTABILIDAD';
}

export class Document {
  // type represented in storage
  storageType: string;

  // public represented type in APIs. should be snake_case
  type: string;

  Renderer: { new (storage: DocumentStorage): Renderer };
  Storage: typeof DelinternetStorage | typeof GfDocStorage;
  initTitle: string;
  signatures: string[];
  loadDetail: (storage: DocumentStorage) => Promise<unknown>;
  cellType?: 'CONTRATO' | 'PORTABILIDAD';

  constructor(params: DocumentCtorParams) {
    this.storageType = params.storageType;
    this.type = params.type;
    this.Renderer = params.Renderer;
    this.Storage = params.Storage;
    this.initTitle = params.initTitle;
    this.signatures = params.signatures;
    this.loadDetail = params.loadDetail ?? (async () => null);
    this.cellType = params.cellType;
  }
}
