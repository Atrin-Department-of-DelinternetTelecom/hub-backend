import { pascalCase } from 'case-anything';
import { Document } from '../document';
import { CellPdfRenderer } from '../renderers/CellPdfRenderer';
import { GfDocStorage } from '../storages/GfDocStorage';
import { loadDetail } from './common/Cell';

class CellContractRenderer extends CellPdfRenderer {
  filenamePrefix = 'aire_contrato';

  getTitle(): string {
    return `${pascalCase(this.cellProvider.name)} Contrato`;
  }
}

export default new Document({
  type: 'cell_contract',
  storageType: 'Goufone-Documents-CellContrato',
  initTitle: 'Cell Contrato',
  signatures: ['default'],
  cellType: 'CONTRATO',
  loadDetail,
  Storage: GfDocStorage,
  Renderer: CellContractRenderer,
});
