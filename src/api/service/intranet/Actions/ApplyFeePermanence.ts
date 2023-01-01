import { AnyModel, intranet } from '@models';
import moment from 'moment';
import { createDiscount } from '../GfDiscountsScheduledService';
import { DISCOUNT_TYPE, TYPE } from '@api/constants/discount';
import { DISCOUNT_SCHEDULED } from '@api/constants/statuses';
import { createInvoiceProduct } from '../InvoiceProductService';
const { InvoiceProduct } = intranet;

export const handle = async (contract: AnyModel, userId: number) => {
  if (
    contract.permanence &&
    moment(contract.deactivationDate).isBefore(
      moment(contract.permanenceEnd),
    ) &&
    contract.permanencePvp
  ) {
    await generateChargePermanenceForContract(contract, userId);
  }
};

const generateChargePermanenceForContract = async (
  contract: AnyModel,
  userId: number,
) => {
  const product = await getPermanenceInvoiceProduct();
  await createDiscount(
    {
      contractId: contract.id,
      date: moment(contract.deactivationDate),
      discountType: DISCOUNT_TYPE.FIX,
      type: TYPE.CHARGE,
      state: DISCOUNT_SCHEDULED.DRAFT,
      // discount should be created with subTotalCost (without tax). the invoicing system will calculate the tax
      discount: calculateFeePermanenceAmount(contract),
      description: product.description,
      tpvCode: product.code,
    },
    {
      userId,
    },
  );
};

const getPermanenceInvoiceProduct = async () => {
  let invoiceProduct = await InvoiceProduct.findOne({
    where: { code: 'FI_PERMANENCIA' },
  });

  if (!invoiceProduct) {
    const newInvoiceProduct = {
      name: `fi permanencia`,
      code: 'FI_PERMANENCIA',
      price: '0',
      costPrice: '0',
      includedTaxs: 0,
      unitTypeId: 3,
      noBillable: 0,
      description: `fi permanencia`,
      lineDescriptions: '',
      taxes: JSON.stringify([{ name: 'IVA', value: '21', id: '1' }]),
    };
    const newProductResponse = await createInvoiceProduct(newInvoiceProduct);

    //refactor payload in createInvoiceProduct
    invoiceProduct = newProductResponse.payload.data as AnyModel;
  }

  return invoiceProduct;
};

export const calculateFeePermanenceAmount = (contract: AnyModel) => {
  const numberOfDaysClientShouldStay = moment(contract.permanenceEnd).diff(
    moment(contract.dateActivation),
    'days',
  );

  const numberOfDaysClientStayed = moment(contract.dateDeactivation).diff(
    moment(contract.dateActivation),
    'days',
  );

  return Number(
    contract.permanencePvp *
      ((numberOfDaysClientShouldStay - numberOfDaysClientStayed) /
        numberOfDaysClientShouldStay),
  );
};
