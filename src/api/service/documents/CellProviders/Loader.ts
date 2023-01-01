/**
 * CellProviderLoader is a class that abstracts aire and lemon difference providers in document system.
 * It will provide universal methods to download/upload documents from lemon and aire
 */

import { intranet } from '@api/models';
import { GfActiveFee } from '@api/models/intranet/intranet_active_fee';
import { GfContractDataCell } from '@api/models/intranet/intranet_gf_contract_data_cell';
import { AireProvider } from './Aire';
import { LemonProvider } from './Lemon';
import { CellProvider } from './type';
import assert from 'assert';
const { GfContract, GfCellProvider } = intranet;

export class CellProviderLoader {
  static async load(contractId: number): Promise<CellProvider> {
    const contract = (await GfContract.findByPk(contractId, {
      include: [
        {
          model: GfContractDataCell,
          as: 'dataCell',
          required: true,
        },
        {
          model: GfActiveFee,
          as: 'activeFee',
          required: true,
          include: [
            {
              model: GfCellProvider,
              as: 'cellProvider',
              required: true,
            },
          ],
        },
      ],
    })) as any;

    assert(contract, `Contract with id:${contractId} not found or invalid`);
    const providerType: string = contract.activeFee?.cellProvider?.code;

    if (providerType === 'aire') {
      return AireProvider.load(contract);
    }

    if (providerType === 'lemon') {
      return LemonProvider.load(contract);
    }

    throw new Error(`invalid cell provider type`);
  }
}
