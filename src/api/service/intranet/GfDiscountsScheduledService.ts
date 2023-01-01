import { AnyModel, intranet } from '@api/models';
import { DISCOUNT_TYPE, MOVEMENT_ACTIONS, TYPE } from '@api/constants/discount';
import { isPopulated, throwIf } from '@api/utils/helpers';
import { omit, pickBy } from 'lodash';

import { DISCOUNT_SCHEDULED } from '@api/constants/statuses';
import ValidationException from '@lib/crud/Exceptions/ValidationException';
import moment from 'moment';
import niv from 'node-input-validator';
import { respondOK } from '@utils/response';

import { v4 } from 'uuid';

const {
  GfDiscountsScheduled,
  GfDiscountsHistory,
  InvoiceProduct,
  transaction,
} = intranet;

niv.extend('GFDS_dateInit', async ({ value }: Record<any, any>) => {
  return moment(value).isSameOrAfter(moment().startOf('month'));
});

niv.extend(
  'GFDS_dateEnd',
  async ({ value }: Record<any, any>, { inputs }: Record<any, any>) => {
    return moment(value).diff(moment(inputs.dateInit), 'months', true) > 0;
  },
);

niv.extend(
  'GFDS_validateDiscount',
  async ({ value }: Record<any, any>, { inputs }: Record<any, any>) => {
    return inputs.discountType === 'fix' ? true : parseFloat(value) <= 100;
  },
);

export const postGfDiscountsMassive = async (
  body: Record<any, any>,
  userId: number,
) => {
  const validator = massiveValidator(body);

  ValidationException.throwUnless(await validator.check(), validator.errors);

  const dateInit = body.dateInit;
  const dateEnd = body.dateEnd;

  const data = {
    ...(omit(body, ['dateInint', 'dateEnd']) as CreationParams),
    date: moment(dateInit),
    state: DISCOUNT_SCHEDULED.PENDING,
    trace: 'massive_' + moment().format('X'),
  };

  const result = await transaction<string>(async () => {
    for (
      let month = 0;
      month < moment(dateEnd).diff(moment(dateInit), 'months', true);
      month++
    ) {
      const { discount } = await createDiscount(data, { userId });
      await syncInvoice(discount, userId);
      data.date = moment(data.date).add(1, 'months');
    }

    return 'done';
  });

  throwIf(result !== 'done', result);

  return respondOK('discounts created');
};

/**
 * Create or update invoice product.
 *
 * @param  object gfDiscount
 */
export const syncInvoice = async (discount: AnyModel, userId: number) => {
  // sets TPV CODE if not provided
  if (!discount.tpvCode) {
    await updateDiscount(discount, { tpvCode: 'DESCGEN' }, { userId });
  }

  // create or update invoice product
  let invoiceProduct = await InvoiceProduct.findOne({
    where: { code: discount.tpvCode },
  });

  if (invoiceProduct !== null) {
    return { success: true };
  }

  invoiceProduct = await InvoiceProduct.create({
    code: discount.tpvCode,
    refererApp: 'goufone',
    refererKey: `discount_${discount.id}`,
    refererData: '',
    name: discount.description,
    description: discount.description,
    taxes_option_1: 'on',
    includedTaxs: 0,
  });

  await updateDiscount(discount, { tpvCode: invoiceProduct.code }, { userId });

  return discount;
};

export interface UpdateParams {
  contractId?: number;
  matrixId?: number;
  executedId?: number;
  permanentParentId?: number;
  date?: moment.Moment;
  description?: string;
  permanent?: number;
  discount?: number;
  discountType?: DISCOUNT_TYPE;
  type?: TYPE;
  state?: DISCOUNT_SCHEDULED;
  fromScheduleId?: number;
  tpvCode?: string;
  trace?: string;
  keyGroup?: string;
  compensatedById?: number;
}
export interface CreationParams extends UpdateParams {
  contractId: number;
  date: moment.Moment;
  discountType: DISCOUNT_TYPE;
  type: TYPE;
  state: DISCOUNT_SCHEDULED;
}

const getStateAction = (state?: DISCOUNT_SCHEDULED) => {
  if (state === DISCOUNT_SCHEDULED.APPLIED) {
    return MOVEMENT_ACTIONS.APPLIED;
  }
  if (state === DISCOUNT_SCHEDULED.PARTIALLY_APPLIED) {
    return MOVEMENT_ACTIONS.PARTIALLY_APPLIED;
  }
  return MOVEMENT_ACTIONS.UPDATE;
};

export const updateDiscount = async (
  discount: AnyModel,
  attributes: UpdateParams,
  options: {
    totalApplied?: number;
    controlRowId?: number;
    userId?: number;
  },
) => {
  const oldDiscount = discount.get({ plain: true });

  await discount.update({
    ...attributes,
    date: moment(attributes.date ?? discount.date).format(
      'YYYY-MM-DD HH:mm:ss',
    ),
  });

  const history = await recordMovement({
    ...options,
    discount: oldDiscount,
    action: getStateAction(attributes.state),
  });

  return { discount, history };
};

//MOVETOINVOICEAPPLICATION
export const generateUpdatedDiscountData = async (
  discount: AnyModel,
  attributes: UpdateParams,
  options: {
    totalApplied?: number;
    controlRowId?: number;
    userId?: number;
  },
) => {
  const oldDiscount = discount.get({ plain: true });

  discount.set({
    ...attributes,
    date: moment(attributes.date ?? discount.date).format(
      'YYYY-MM-DD HH:mm:ss',
    ),
  });

  const history = (await recordMovement({
    ...options,
    discount: oldDiscount,
    action: getStateAction(attributes.state),
    insert: false,
  })) as Exclude<Awaited<ReturnType<typeof recordMovement>>, AnyModel>;

  return { discount: discount.get({ plain: true }) as AnyModel, history };
};

export const createDiscount = async (
  attributes: CreationParams,
  options: {
    totalApplied?: number;
    controlRowId?: number;
    userId?: number;
  },
) => {
  const discount = await GfDiscountsScheduled.create({
    matrixId: null,
    executedId: null,
    permanentParentId: null,
    description: null,
    permanent: 0,
    discount: 0,
    discountType: DISCOUNT_TYPE.FIX,
    type: TYPE.DISCOUNT,
    state: DISCOUNT_SCHEDULED.PENDING,
    fromScheduleId: null,
    tpvCode: null,
    trace: null,
    keyGroup: null,
    compensatedById: null,
    ...pickBy(attributes, isPopulated),
    date: attributes.date.format('YYYY-MM-DD HH:mm:ss'),
  });

  const history = await recordMovement({
    ...options,
    discount,
    action: MOVEMENT_ACTIONS.INSERT,
  });

  return { discount, history };
};

//MOVETOINVOICEAPPLICATION
export const generateCreateDiscountData = async (
  attributes: CreationParams,
  options: {
    totalApplied?: number;
    controlRowId?: number;
    userId?: number;
  },
) => {
  const discount = {
    id: v4(),
    matrixId: null,
    executedId: null,
    permanentParentId: null,
    description: null,
    permanent: 0,
    discount: 0,
    discountType: DISCOUNT_TYPE.FIX,
    type: TYPE.DISCOUNT,
    state: DISCOUNT_SCHEDULED.PENDING,
    fromScheduleId: null,
    tpvCode: null,
    trace: null,
    keyGroup: null,
    compensatedById: null,
    ...pickBy(attributes, isPopulated),
    date: attributes.date.format('YYYY-MM-DD HH:mm:ss'),
  };

  const history = (await recordMovement({
    ...options,
    discount,
    action: MOVEMENT_ACTIONS.INSERT,
    insert: false,
  })) as Exclude<Awaited<ReturnType<typeof recordMovement>>, AnyModel>;

  return { discount, history };
};

export const cancelDiscounts = async (
  discounts: AnyModel[],
  options: {
    totalApplied?: number;
    controlRowId?: number;
    userId?: number;
  },
) => {
  await Promise.all(
    discounts.map((discount) => {
      return recordMovement({
        ...options,
        discount,
        action: MOVEMENT_ACTIONS.DELETE,
      });
    }),
  );

  await GfDiscountsScheduled.update(
    { state: DISCOUNT_SCHEDULED.CANCELED },
    { where: { id: discounts.map((discount) => discount.id) } },
  );
};

export const recordMovement = async ({
  discount,
  action,
  totalApplied = null,
  controlRowId = 0,
  userId = null,
  insert = true,
}: {
  discount: AnyModel | (object & { id: string });
  action: MOVEMENT_ACTIONS;
  totalApplied?: number | null;
  controlRowId?: number;
  userId?: number | null;
  insert?: boolean | undefined;
}) => {
  const discountHistoryObject = {
    scheduledId: insert ? (discount.id as number) : (discount.id as string),
    date: moment().format('YYYY-MM-DD HH:mm:ss'),
    userId,
    controlRowId,
    action: action,
    amount: [
      MOVEMENT_ACTIONS.APPLIED,
      MOVEMENT_ACTIONS.PARTIALLY_APPLIED,
    ].includes(action)
      ? totalApplied
      : null,
    previousRow: [MOVEMENT_ACTIONS.INSERT, MOVEMENT_ACTIONS.DELETE].includes(
      action,
    )
      ? null
      : JSON.stringify(discount),
  };
  return insert
    ? GfDiscountsHistory.create(discountHistoryObject)
    : discountHistoryObject;
};

const massiveValidator = (body: Record<string, any>) => {
  return new niv.Validator(
    body,
    {
      contractId: 'sometimes|existsOnIntranet:GfContract',
      description: 'required',
      dateInit: 'required|dateiso|GFDS_dateInit',
      dateEnd: 'required|dateiso|GFDS_dateEnd',
      type: 'required|in:discount,charge',
      discountType: 'required|in:percentage,fix',
      discount: 'required|GFDS_validateDiscount',
    },
    {
      GFDS_validateDiscount: 'Discount percentage should be less than 100.',
      GFDS_dateInit: 'Invalid dateInit',
      GFDS_dateEnd: 'The discount duration is at least one month',
    },
  );
};

export const availableLanguage = ['en', 'es', 'ca'];

//this data setted staticly, maybe in future due to our requirements, changed to a resource.
export const ShortcutMassiveDiscount = [
  {
    id: 1,
    title: {
      en: 'referral discount (6 months)',
      es: 'descuento por referencia (6 meses)',
      ca: 'descompte per referència (6 mesos)',
    },
    month: 6,
    massiveParam: {
      description: `Descompte 10% servei d'internet`,
      tpvCode: 'DESCGEN',
      type: 'discount',
      discountType: 'percentage',
      discount: 10,
    },
  },
  {
    id: 2,
    title: {
      en: 'Offer 10 years (3 months)',
      es: 'Oferta 10 años (3 meses)',
      ca: 'Oferta 10 anys (3 mesos)',
    },
    month: 3,
    massiveParam: {
      description:
        'Oferta 10 anys , quota de fibra 10 € durant 3 mesos IVA INCLOS',
      tpvCode: 'DESCGEN',
      type: 'discount',
      discountType: 'fix',
      discount: 16.44,
    },
  },
];

export const getShortcutMassiveDiscount = () => {
  return ShortcutMassiveDiscount.map(({ id, title }) => ({
    id,
    title,
  }));
};

export const createDiscountForBreakedPermanent = async (
  replicate: {
    id: number;
    matrixId: number;
    executed: object;
    updateDate: number;
    creationDate: number;
    date: string;
    executedId: number;
  },
  userId: number,
) => {
  const nextDiscount = await GfDiscountsScheduled.findOne({
    where: {
      date: moment().startOf('month').format('YYYY-MM-DD'),
      matrixId: replicate.matrixId,
      executedId: replicate.executedId,
      permanent: 1,
      permanentParentId: replicate.id,
    },
  });

  const {
    id,
    executed,
    updateDate,
    creationDate,
    date,
    ...propsForCreateNewDiscount
  } = replicate;

  if (!nextDiscount) {
    const { discount: created } = await createDiscount(
      //@ts-ignore
      {
        ...propsForCreateNewDiscount,
        date: moment().startOf('month'),
        permanent: 1,
        permanentParentId: id,
        state: DISCOUNT_SCHEDULED.PENDING,
      },
      { userId },
    );
    return created;
  }
  return null;
};
