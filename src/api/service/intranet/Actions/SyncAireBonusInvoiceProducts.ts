import { AnyModel, intranet } from '@api/models';

import { firstPopulated } from '@api/utils/helpers';

const { InvoiceProduct } = intranet;

/**
 * Create an invoice-product for given bonuses if not exists.
 */
export const handle = async (bonuses: AnyModel[] = []): Promise<AnyModel[]> => {
  const existingCodes = await getExistingInvoiceProductCodes(bonuses);

  const updates: AnyModel[] = [];
  for (const bonus of bonuses) {
    const code = firstPopulated([bonus.tpvCode, bonus.providerBonusId, null]);
    if (!existingCodes.includes(code)) {
      const { code: tpvCode } = await createInvoiceProduct(bonus, code);
      updates.push(await bonus.update({ tpvCode }));
      // Add the new code to the existing codes list to prevent generating again
      existingCodes.push(tpvCode);
    }
  }

  console.log(`[${new Date()}] following invoice-products created:`);
  console.log(updates.map(({ tpvCode }) => tpvCode));

  return updates;
};

const getExistingInvoiceProductCodes = async (
  bonuses: AnyModel[],
): Promise<string[]> => {
  const where: Record<string, any> = {};
  // limit to given bonuses
  if (bonuses.length > 0) {
    where.code = bonuses.map(({ tpvCode, providerBonusId }) => {
      return firstPopulated([tpvCode, providerBonusId]);
    });
  }
  const invoiceProducts = await InvoiceProduct.findAll({
    raw: true,
    attributes: ['code'],
    where,
    group: ['code'],
  });

  return invoiceProducts.map(({ code }) => code);
};

const createInvoiceProduct = async (
  bonus: AnyModel,
  tpvCode: string,
): Promise<AnyModel> => {
  return InvoiceProduct.create({
    refererApp: 'goufone',
    refererKey: `cellProviderBono_${bonus.id}`,
    refererData: '',
    name: bonus.name,
    description: bonus.description,
    price: bonus.pvp,
    includedTaxs: 0,
    code: tpvCode,
  });
};
