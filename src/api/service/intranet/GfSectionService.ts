import { AnyModel } from '@api/models';
import { Facade } from './Contract/contracts';
import { GfContractDataCell } from '@api/models/intranet/intranet_gf_contract_data_cell';
import { GfContractDataFix } from '@api/models/intranet/intranet_gf_contract_data_fix';
import { GfContractDataInternet } from '@api/models/intranet/intranet_gf_contract_data_internet';
import { GfContractDataSubscription } from '@api/models/intranet/intranet_gf_contract_data_subscription';
import { GfContractDataTv } from '@api/models/intranet/intranet_gf_contract_data_tv';
import { GfContractSectionStatus } from '@api/models/intranet/intranet_gf_contracts_section_status';
import { GfSection } from '@api/models/intranet/intranet_gf_sections';
import { SERVICE } from '@api/constants/contracts';
import { Static } from '@lib/cache';
import assert from 'assert';
import factory from './Contract/Facades';
import { getAllEntities } from '@utils/request-handler';

const dataModels = {
  [SERVICE.INTERNET]: GfContractDataInternet,
  [SERVICE.FIX]: GfContractDataFix,
  [SERVICE.CELL]: GfContractDataCell,
  [SERVICE.TV]: GfContractDataTv,
  [SERVICE.SUBSCRIPTION]: GfContractDataSubscription,
};

export const getContractSectionCode = async (contractId: number) => {
  const status = await GfContractSectionStatus.findOne({
    where: { contractId },
    include: { model: GfSection, as: 'section' },
  });
  return status?.section.code;
};

export const getSectionCodeById = async (id: number): Promise<SERVICE> => {
  return Static.sear(__filename + '@getSectionCodeById:' + id, async () => {
    const section = await GfSection.findByPk(id);
    assert(section, `Section with id ${id} not found!`);
    return section.code;
  });
};

export const getSectionIdByCode = async (code: string): Promise<number> => {
  return Static.sear(__filename + '@getSectionIdByCode:' + code, async () => {
    const section = await GfSection.findByCode(code);
    assert(section, `Section with code ${code} not found!`);
    return section.id;
  });
};

export const getContractSection = async (
  contractId: number,
  sectionType: SERVICE,
): Promise<(typeof dataModels)[SERVICE]> => {
  return (dataModels[sectionType] as unknown as AnyModel).findOne({
    where: { contractId },
  })!;
};

export const getGfSections = async function (query: Record<string, unknown>) {
  return getAllEntities(query, GfSection as unknown as AnyModel, {});
};

/**
 * Get facade name by section type.
 */
export const getFacadeBySectionCode = function (sectionCode: SERVICE) {
  return factory(String(sectionCode).toUpperCase() as SERVICE);
};

export const getFacadeBySectionId = async function (
  sectionId: number,
): Promise<Facade> {
  return factory(await getSectionCodeById(sectionId));
};
