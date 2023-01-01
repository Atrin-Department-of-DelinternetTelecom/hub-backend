import {
  SECTION_STATUS,
  SECTION_STATUS_PENDINGS,
} from '@api/constants/statuses';

import { AnyModel } from '@api/models';
import { CELL_PROVIDER_CODE } from '@api/constants/contracts';
import { GfCellProvider } from '@api/models/intranet/intranet_gf_cell_providers';
import { GfCellProviderFee } from '@api/models/intranet/intranet_gf_cell_providers_fees';
import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import { GfContractDataCell } from '@api/models/intranet/intranet_gf_contract_data_cell';
import { GfFee } from '@api/models/intranet/intranet_gf_fees';
import { OperationState } from './constants';

export type ServiceState = {
  state: SECTION_STATUS;
  pendingState: SECTION_STATUS_PENDINGS | null;
};

export type ProcessState = {
  state: OperationState;
};

export type ResumeState = {
  state: OperationState;
};

export type ProviderState = {
  state: SECTION_STATUS;
  stateText: string | null;
  reason: string | null;
};

export type CellProviderState = ProviderState & {
  provider: CELL_PROVIDER_CODE;
};

export type ProviderCondition = {
  condition: GfFee;
  cellFee: GfCellProviderFee;
  provider: GfCellProvider;
};

export type ContractCondition = ProviderCondition & {
  contract: AnyModel;
  dataCell: AnyModel & GfContractDataCell;
  client: GfClient;
};
