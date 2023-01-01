export type CreateFeeBodySameProps = {
  name: string;
  fromDate: string;
  baseQuote: string;
  initialCost: string;
  tpvCode: string;
  feeGroupId: number;
  autoUpdate?: boolean;
  initialCostTpvCode?: string;
  classBuilder?: string;
  ivozId?: string;
  initial_fees?: number[];
};

export type CellInformationBody = {
  cellProviderId?: number;
  cellFee?: number;
  cellPercentage?: string;
};

export type InternetInformationBody = {
  internetIncludedMb: number | null;
  internetIncludedUpMb: number | null;
  internetSLAType?: '24x7-8h' | '8x5-16h' | '8x5-8h';
  internetTechnology:
    | 'altres'
    | '4g'
    | 'adsl'
    | 'fibra'
    | 'radio'
    | 'no_nostre';
  internetDefaultCpeLineProfile?: string;
  internetExcludeFromRadius?: number | null;
  internetTax?: string;
  internetTechnologyAnalitic?:
    | 'ADSL'
    | 'BONOSRAROS'
    | 'RADIO'
    | 'FIXBONUS'
    | 'FIBRA'
    | 'FIBRAINTERNET'
    | 'TV'
    | 'FIX';
  internetPercentageRule?: 'INTERNET' | 'INTERNET+BONO';
  internetCapexType?: number | null;
  internetOpexValue?: string;
  internetInfraIp?: string;
  internetTransit?: string;
  internetSuportCor?: string | null;
  internetRadiusGroupName?: string | null;
};

export type FixInformationBody = {
  fixConcurrentCalls?: number | null;
  fixCallForwarded?: boolean | null;
};

export type CreateCellFeeBody = CreateFeeBodySameProps & CellInformationBody;
export type CreateInternetFeeBody = CreateFeeBodySameProps &
  InternetInformationBody;
export type CreateFixFeeBody = CreateFeeBodySameProps & FixInformationBody;

export type CreateAndUpdateFeeBody =
  | CreateCellFeeBody
  | CreateInternetFeeBody
  | CreateFixFeeBody;

export type dataSectionValidationFunction = (
  arg: CreateAndUpdateFeeBody,
) => boolean;
