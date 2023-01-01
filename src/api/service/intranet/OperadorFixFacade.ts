import { AnyModel, intranet } from '@models';
import { DOCUMENT_TYPES, RequestParams } from '@del-internet/sdk-operadors';

import { GfClient } from '@api/models/intranet/intranet_gf_clients';
import OperadorIvozService from './OperadorIvozService';
import assert from 'assert';
import { camelCase } from 'case-anything';
import { get as config } from '@config';
import { spainIdType } from 'spain-id';

import GfContractSectionStatusService = require('./GfContractSectionStatusService');

const { GfContract, GfIvozFix } = intranet;

const MUNICIPALITY = config('index.operadors.municipality', 'Deltebre');
const PORTABLE_PROCESS_CODE = config('index.operadors.portabProcessCode', '15');
const PORTABLE_TYPE_CODE = config('index.operadors.portabTypeCode', '01');
const DONOR_RESELLER_OPERATOR = null; //'DEL-INTERNET TELECOM,S.L.';
const PORTABLE_WHOLE_SALE = config('index.operadors.portabWholesaleCode', '0');

const portabilityKeyMapping = {
  identificador: 'id',
  'client operador': 'operatorClient',
  'client final': 'endClient',
  nif: 'taxIdentificationNumber',
  província: 'province',
  municipi: 'municipality',
  'codi postal': 'postalCode',
  adreça: 'address',
  'tipus de procés': 'processType',
  "tipus d'accés": 'accessType',
  'accés majorista': 'wholesaleAccess',
  'número administratiu majorista': 'wholesaleAdministrativeNumber',
  'número identificador majorista': 'wholesaleIdentifierNumber',
  observacions: 'observations',
  'número de procés': 'processNumber',
  "número d'ordre": 'orderNumber',
  'data de sol·licitud': 'requestDate',
  'finestra de canvi preferida': 'preferredChangeWindow',
  'inici finestra de canvi': 'changeWindowStart',
  'operador donant': 'donatingOperator',
  'operador revenedor donant': 'donatingResellingOperator',
  'routing set': 'routingSet',
  'pla de tarifes': 'tariffPlan',
  'nom del grup perfil de tarifes': 'tariffProfileGroupName',
  estat: 'status',
  'raó de la cancel·lació': 'cancellationReason',
  'estat previ': 'previousStatus',
  'completat en data': 'completedOnDate',
  numeració: 'numbers',
};
interface KeyMapping {
  [key: string]: string;
}
export enum StatusEnum {
  NOT_SUBMITTED_TO_RE = "Pendent d'enviar a l'ER",
  SUBMITTED_TO_RE = "Enviat a l'ER",
  ERROR_FILE_VALIDATION = 'Error en la validació del fitxer',
  DENIED_BY_RE = "Denegat per l'ER",
  QUEUED_BY_RE = "Posat a la cua per l'ER",
  APPROVED_BY_RE = "Aprovat per l'ER",
  DENIED_BY_DONOR = "Denegat per l'operador donant",
  APPROVED_BY_DONOR = "Aprovat per l'operador donant",
  CONFIRMED_BY_RE = "Confirmat per l'ER",
  CANCELLATION_NOT_SUBMITTED_TO_RE = "Cancel·lació pendent d'enviar a l'ER",
  CANCELLATION_SUBMITTED_TO_RE = "Cancel·lació enviada a l'ER",
  CANCELLATION_ERROR_FILE_VALIDATION = 'Error en la validació del missatge de cancel·lació',
  CANCELLATION_DENIED_BY_RE = "Cancel·lació denegada per l'ER",
  CANCELLATION_APPROVED_BY_RE = "Cancel·lació aprovada per l'ER",
  CANCELLED_BY_RE = "Cancel·lat per l'ER",
  CONSOLIDATED = 'Consolidada',
}

export const statusMapping: {
  [statusDescription: string]: keyof typeof StatusEnum;
} = {
  "Pendent d'enviar a l'ER": 'NOT_SUBMITTED_TO_RE',
  "Enviat a l'ER": 'SUBMITTED_TO_RE',
  'Error en la validació del fitxer': 'ERROR_FILE_VALIDATION',
  "Denegat per l'ER": 'DENIED_BY_RE',
  "Posat a la cua per l'ER": 'QUEUED_BY_RE',
  "Aprovat per l'ER": 'APPROVED_BY_RE',
  "Denegat per l'operador donant": 'DENIED_BY_DONOR',
  "Aprovat per l'operador donant": 'APPROVED_BY_DONOR',
  "Confirmat per l'ER": 'CONFIRMED_BY_RE',
  "Cancel·lació pendent d'enviar a l'ER": 'CANCELLATION_NOT_SUBMITTED_TO_RE',
  "Cancel·lació enviada a l'ER": 'CANCELLATION_SUBMITTED_TO_RE',
  'Error en la validació del missatge de cancel·lació':
    'CANCELLATION_ERROR_FILE_VALIDATION',
  "Cancel·lació denegada per l'ER": 'CANCELLATION_DENIED_BY_RE',
  "Cancel·lació aprovada per l'ER": 'CANCELLATION_APPROVED_BY_RE',
  "Cancel·lat per l'ER": 'CANCELLED_BY_RE',
  Consolidada: 'CONSOLIDATED',
};

export type ExecutePortabilityParams = {
  reseller?: string;
  extension: string;
  nif?: string;
  zip?: string;
  city?: string;
  province_code?: string;
  process_code?: string;
  type_code?: string;
  wholesale_code?: string;
  numbers?: string;
  reseller_operator?: string;
};
export class OperadorFixFacade {
  async execute(contractId: number) {
    const contract = await GfContract.findByPk(contractId);
    if (!contract) {
      return {
        success: false,
        error: `${GfContract.name} with id:${contractId} was not found`,
      };
    }
    if (contract.isSuspended()) {
      return {
        debug: 1,
        success: true,
        pending: false,
      };
    }
    const client = await GfClient.findByContractId(contractId);
    assert(client, `Client not found for contract ${contractId}`);
    const sectionStatus = await GfContractSectionStatusService.findForContract(
      contractId,
    );
    if (!sectionStatus) {
      return {
        success: false,
        error: 'Section status not found',
      };
    }
    const ivoz = await GfIvozFix.findOne({
      where: {
        contractId: contractId,
      },
    });
    assert(ivoz, `IvozFix for contract ${contractId} not found`);
    const customer = await this.executeCustomer(client);
    if (!customer.success) {
      return {
        success: false,
        error: customer.reason ?? 'Customer not found',
      };
    }
    return this.executePortabilities(client, { extension: ivoz.extension });
  }

  async executeCustomer(client: any) {
    const customer = await OperadorIvozService.getCustomerByNIF(
      client.fiscalId,
    );

    if (customer.success) {
      return customer;
    }
    if (!client.name) {
      return {
        success: false,
        reason: 'Client name cannot be empty',
      };
    }

    assert(
      client.addressProvinceCode,
      'Client doesn\'t have "addressProvinceCode"',
    );

    return OperadorIvozService.createCustomer({
      fiscal_id: client.fiscalId,
      zip: client.addressPostalCode,
      municipality: MUNICIPALITY,
      document_type: spainIdType(client.fiscalId)
        ? DOCUMENT_TYPES.NIF
        : DOCUMENT_TYPES.PASSPORT,
      province_code:
        client.addressProvinceCode.split('P')[1] ?? client.addressProvinceCode,
      name: client.name,
      street: this.generateFormattedAddress(client),
    });
  }
  async executePortabilities(
    client: GfClient,
    params: ExecutePortabilityParams,
  ) {
    const portability = await this.ensureOfPortabilityRequest(client, params);

    portability.data = this.transformKeysWithMapping(
      portability.data,
      portabilityKeyMapping,
    );

    if (!portability.success || !portability.data) {
      return portability;
    }

    return {
      success: true,
      pending: false,
      data: {
        ...portability.data,
        imported: portability.data.status === StatusEnum.CONSOLIDATED,
        status: this.transformStatus(portability.data.status),
      },
    };
  }

  async ensureOfPortabilityRequest(
    client: GfClient,
    params: ExecutePortabilityParams,
  ) {
    const portability = await this.getInboundPortability({
      number: params.extension,
    });

    if (portability.success) {
      return portability;
    }

    return OperadorIvozService.createPortability({
      fiscal_id: params.nif ?? client.fiscalId,
      zip: params.zip ?? String(client.addressPostalCode),
      municipality: params.city ?? MUNICIPALITY,
      province_code:
        params.province_code?.split('P')[1] ??
        client.addressProvinceCode.split('P')[1] ??
        params.province_code,
      process_code: params.process_code ?? PORTABLE_PROCESS_CODE,
      access_type_code: params.type_code ?? PORTABLE_TYPE_CODE,
      wholesale_code: params.wholesale_code ?? PORTABLE_WHOLE_SALE,
      numbers: [{ startNumber: params.extension, endNumber: params.extension }],
      donor_reseller_operator:
        params.reseller === undefined
          ? DONOR_RESELLER_OPERATOR
          : params.reseller,
    });
  }

  async getInboundPortability(params: RequestParams) {
    const portabilities = await OperadorIvozService.getInboundPortabilities(
      params,
    );
    if (!portabilities.success) {
      return {
        success: false,
        error: portabilities.reason ?? 'Portability not found',
      };
    }
    if (portabilities.data.length === 0) {
      return {
        success: false,
        error: 'Portability not found',
      };
    }
    const portability = await OperadorIvozService.getInboundPortabilityByID(
      portabilities.data[0].id,
    );

    return portability.success
      ? {
          success: true,
          pending: false,
          data: portability.data,
        }
      : {
          success: false,
          error: portability.reason ?? 'Portability not found',
        };
  }
  async getOperadorsStatus(contractId: number) {
    const contract = await GfContract.findByPk(contractId);
    assert(contract, `Contract ${contractId} not found`);
    if (!contract) {
      return {
        success: false,
        error: `${GfContract.name} with id:${contractId} was not found`,
      };
    }
    if (contract.isSuspended()) {
      return {
        debug: 1,
        success: true,
        pending: false,
      };
    }
    const sectionStatus = await GfContractSectionStatusService.findForContract(
      contractId,
    );
    if (!sectionStatus) {
      return {
        success: false,
        error: 'Section status not found',
      };
    }
    const ivoz = await GfIvozFix.findOne({
      where: {
        contractId: contractId,
      },
    });
    assert(ivoz, `IvozFix for contract ${contractId} not found`);
    const portability = await this.getInboundPortability({
      number: ivoz.extension,
    });

    if (portability.success && portability.data) {
      portability.data = this.transformKeysWithMapping(
        portability.data,
        portabilityKeyMapping,
      );
      portability.data.imported =
        portability.data.status === StatusEnum.CONSOLIDATED;
      portability.data.status = this.transformStatus(portability.data.status);
      return portability;
    }
    return portability;
  }
  transformKeysWithMapping(data: any, keyMapping: KeyMapping): any {
    function transformRecursive(value: any): any {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          return transformList(value);
        } else {
          return transformObject(value);
        }
      } else {
        return value;
      }
    }

    function transformObject(obj: { [key: string]: any }): {
      [key: string]: any;
    } {
      const transformed: { [key: string]: any } = {};
      for (const key in obj) {
        const newKey = keyMapping[key] || key;
        const camelKey = camelCase(newKey);
        transformed[camelKey] = transformRecursive(obj[key]);
      }
      return transformed;
    }

    function transformList(arr: any[]): any[] {
      return arr.map((item) => transformRecursive(item));
    }

    return transformRecursive(data);
  }
  transformStatus(status: string) {
    return statusMapping[status] ?? status;
  }
  generateFormattedAddress(client: AnyModel): string {
    const {
      addressStreet,
      addressNumber,
      addressFloor,
      addressDoor,
      addressBuilding,
      addressStairway,
      addressPostalCode,
      addressCity,
      addressProvince,
    } = client;

    let addressString = addressStreet ? `${addressStreet}` : '';

    if (addressNumber) {
      addressString += `, ${addressNumber}`;
    }
    if (addressFloor) {
      addressString += `, ${addressFloor}º`;
      if (addressDoor) {
        addressString += `-${addressDoor}ª`;
      }
    } else if (addressDoor) {
      addressString += `, ${addressDoor}ª`;
    }

    if (addressBuilding) {
      addressString += `, building ${addressBuilding}`;
      if (addressStairway) {
        addressString += `, ${addressStairway}`;
      }
    }

    if (addressPostalCode) {
      addressString += `, ${addressPostalCode}`;
    }
    if (addressCity) {
      addressString += `, ${addressCity}`;
    }
    if (addressProvince) {
      addressString += `, ${addressProvince}`;
    }
    // to ensure character lengths not exceed 80
    return addressString
      .split(' ')
      .reduce((a, b) => (a.length + b.length < 80 ? `${a}${b} ` : a), '')
      .trim();
  }
  async getCdr(year: string, month: string, day?: string) {
    return OperadorIvozService.getCdr(year, month, day);
  }
}
export const operadorFixFacadeInstance = new OperadorFixFacade();
export default operadorFixFacadeInstance;
