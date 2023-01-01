import { AnyModel } from '@api/models';
import { ServiceRecord } from './GfContractSectionStatusService';
import { genericDocs } from '../documents/GfDocumentService';

export const ensureOfDocument = async function (
  contract: AnyModel,
  status: ServiceRecord,
) {
  try {
    // create generic doc
    // return await genericDocs(contract, status);
  } catch (e) {
    // statements
    console.log(e);
  }
};
