const {
  allModels: { GfContract, GfDiscountsHistory, GfDiscountsScheduled },
} = require('@models');

import Request from '@root/tests/Request';

const endpoint = (id) => `/api/v1/gf-discounts-scheduleds/${id}`;
jest.setTimeout(1 * 60 * 60 * 1000);

beforeEach(async () =>
  Promise.all([
    GfContract.destroy({ truncate: true }),
    GfDiscountsScheduled.destroy({ truncate: true }),
    GfDiscountsHistory.destroy({ truncate: true }),
  ]),
);

const createDiscount = async () => {
  return GfDiscountsScheduled.create({
    contractId: 10000,
    date: '2022-02-02',
    discount: 0,
    type: 'discount',
    description: 'description',
    permanent: 0,
    discountType: 'fix',
    state: 'pending',
    userId: 1,
  });
};

// Positive test group ('Happy path tests)
describe('Positive Tests', () => {
  describe('Security Tests', () => {
    // 1. check authorization
    it('have to return 200 for authorized request', async () => {
      const discount = await createDiscount();

      return Request.put(endpoint(discount.id))
        .set('Authorization', await Request.authorization())
        .send({})
        .expect((res) => {
          expect(res.headers['content-type']).toMatch(/application\/json/);
        })
        .expect(200);
    });
    // 2. check ACL
    it.todo('should pass operation access');
  });
  describe('Validation Tests', () => {
    it('have to pass validation for minimum valid inputs', async () => {
      const discount = await createDiscount();
      const body = discount.get({ plain: true });
      delete body.creationDate;
      delete body.updateDate;
      delete body.tpvCode;
      body.permanent = discount.permanent > 0 ? 1 : 0;

      return Request.put(endpoint(discount.id))
        .set('Authorization', await Request.authorization())
        .send({})
        .expect(200)
        .then((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(200);
          expect(response.body.data).toMatchObject(body);
        });
    });
  });
  describe('Edge-case Tests', () => {
    it('have to return 404 for not exists discount', async () => {
      return Request.put(endpoint(-1))
        .set('Authorization', await Request.authorization())
        .send({})
        .expect(200)
        .expect((res) => expect(res.body.code).toBe(404));
    });
  });
  describe('Opertaion Tests', () => {
    it('have to update `gf-discount-scheduled` by valid inputs', async () => {
      const discount = await createDiscount();
      const body = {
        contractId: discount.contractId,
        date: '2022-02-03',
        discount: 0,
        type: 'charge',
        description: 'new description',
        permanent: 0,
        discountType: 'percentage',
        state: 'pending',
      };

      return Request.put(endpoint(discount.id))
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .then(async (response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(200);
          expect(response.body.data).toMatchObject(body);
          // ensure that database is up to date
          const discountRecord = await GfDiscountsScheduled.findByPk(
            response.body.data.id,
          );

          expect(discountRecord).not.toBeNull();
          expect(discountRecord).toMatchObject({
            ...body,
            permanent: Boolean(body.permanent),
          });
        });
    });

    it('have to update `gf-discount-history` after discount updating', async () => {
      const discount = await createDiscount();
      const body = {
        contractId: discount.contractId,
        date: '2022-02-03',
        discount: 0,
        type: 'charge',
        description: 'new description',
        permanent: 0,
        discountType: 'percentage',
        state: 'pending',
      };

      return Request.put(endpoint(discount.id))
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .then(async (response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(200);

          const recordMovement = await GfDiscountsHistory.findOne({
            where: {
              scheduledId: discount.id,
              action: 'edited',
              amount: null,
            },
          });

          expect(recordMovement).not.toBeNull();
        });
    });

    it('have to create coorect `gf-discount-history` when state changes to applied', async () => {
      const discount = await createDiscount();
      const body = {
        contractId: discount.contractId,
        date: '2022-02-03',
        discount: 0,
        type: 'charge',
        description: 'new description',
        permanent: 0,
        discountType: 'percentage',
        state: 'applied',
      };

      return Request.put(endpoint(discount.id))
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .then(async (response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(200);

          const recordMovement = await GfDiscountsHistory.findOne({
            where: {
              scheduledId: discount.id,
              action: 'applied',
            },
          });

          expect(recordMovement).not.toBeNull();
        });
    });

    it('have to create coorect `gf-discount-history` when state changes to partialApplied', async () => {
      const discount = await createDiscount();
      const body = {
        contractId: discount.contractId,
        date: '2022-02-03',
        discount: 0,
        type: 'charge',
        description: 'new description',
        permanent: 0,
        discountType: 'percentage',
        state: 'partialApplied',
      };

      return Request.put(endpoint(discount.id))
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .then(async (response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(200);

          const recordMovement = await GfDiscountsHistory.findOne({
            where: {
              scheduledId: discount.id,
              action: 'partialApplied',
            },
          });

          expect(recordMovement).not.toBeNull();
        });
    });
  });
});
// Negetive test gtoup
describe('Negetive Tests', () => {
  describe('Security Tests', () => {
    // 1. check authorization
    it('have to return 403 for unauthorized request', () => {
      return Request.put(endpoint())
        .expect(403)
        .then((res) => {
          expect(res.headers['content-type']).toMatch(/application\/json/);
        });
    });
    // 2. check ACL
    it.todo('prevent operation for invalid user');
  });
  describe('Validation Tests', () => {
    it('have to error 400 for invalid contractId', async () => {
      const discount = await createDiscount();

      return Request.put(endpoint(discount.id))
        .set('Authorization', await Request.authorization())
        .send({ contractId: Date.now() })
        .expect(200)
        .then((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(400);
          expect(response.body.errors).toMatchObject({});
          expect(response.body.errors.contractId.length).not.toBe(0);
        });
    });

    it('have to error 400 for percentage discount more than 100', async () => {
      const discount = await createDiscount();
      const body = {
        discount: 100.1,
        discountType: 'percentage',
      };

      return Request.put(endpoint(discount.id))
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .then((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(400);
          expect(response.body.errors).toMatchObject({});
          expect(response.body.errors.discount.length).not.toBe(0);
        });
    });
  });
  describe('Edge-case Tests', () => {
    it('have to return 500 for undefined discount id', async () => {
      return Request.put(endpoint())
        .set('Authorization', await Request.authorization())
        .send({})
        .expect(200)
        .expect((response) => expect(response.body.code).toBe(400));
    });

    it('have to prevent update contractId', async () => {
      const discount = await createDiscount();

      return Request.put(endpoint(discount.id))
        .set('Authorization', await Request.authorization())
        .send({ contractId: Date.now() })
        .expect(200)
        .then(async (response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(400);
          expect(response.body.errors).toMatchObject({});
          expect(response.body.errors.contractId.length).not.toBe(0);
        });
    });
  });
  describe('Opertaion Tests', () => {});
});
