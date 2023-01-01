import { pascalCase } from 'case-anything';
import { Document } from '../document';
import { CellPdfRenderer } from '../renderers/CellPdfRenderer';
import { GfDocStorage } from '../storages/GfDocStorage';
import { loadDetail } from './common/Cell';

class CellPortabilityRenderer extends CellPdfRenderer {
  filenamePrefix = 'aire_portabilidad';

  getTitle() {
    return `${pascalCase(this.cellProvider.name)} Portabilidad`;
  }
}

export default new Document({
  type: 'cell_portability',
  storageType: 'Goufone-Documents-CellPortabilidad',
  initTitle: 'Cell Portabilidad',
  signatures: ['default'],
  cellType: 'PORTABILIDAD',
  loadDetail,
  Storage: GfDocStorage,
  Renderer: CellPortabilityRenderer,
});
