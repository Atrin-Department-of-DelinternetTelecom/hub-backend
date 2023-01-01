const {
  allModels: {
    GfContract,
    GfDiscountsHistory,
    GfDiscountsScheduled,
    InvoiceProduct,
  },
} = require('@models');

import Request from '@root/tests/Request';

const endpoint = () => `/api/v1/gf-discounts-scheduleds`;

jest.setTimeout(5 * 60 * 60 * 1000);

beforeEach(async () =>
  Promise.all([
    GfContract.destroy({ truncate: true }),
    GfDiscountsScheduled.destroy({ truncate: true }),
    GfDiscountsHistory.destroy({ truncate: true }),
  ]),
);

// Positive test group ('Happy path tests)
describe('Positive Tests', () => {
  describe('Security Tests', () => {
    // 1. check authorization
    it('have to return 200 for authorized request', async () => {
      return Request.post(endpoint())
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
      const contract = await GfContract.create({});

      const body = {
        contractId: contract.id,
        date: '2022-02-02',
        discount: 0,
        type: 'discount',
        description: 'description',
        permanent: 0,
        discountType: 'fix',
        state: 'pending',
      };

      return Request.post(endpoint())
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .expect((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(201);
          expect(response.body.data).toMatchObject(body);
        });
    });
  });
  describe('Edge-case Tests', () => {
    // 1. check edge-case inputs
    // it.todo('should pass for valid edge-cases');
  });
  describe('Opertaion Tests', () => {
    it('have to create `gf-discount-scheduled` by valid inputs', async () => {
      const contract = await GfContract.create({});

      const body = {
        contractId: contract.id,
        date: '2022-02-02',
        discount: 0,
        type: 'discount',
        description: 'description',
        permanent: 0,
        discountType: 'fix',
        state: 'pending',
      };

      return Request.post(endpoint())
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .expect((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(201);
          expect(response.body.data).toMatchObject(body);
        })
        .then(async (response) => {
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
    it('have to set `tpvCode` after discount creation if not provided', async () => {
      const contract = await GfContract.create({});

      const body = {
        contractId: contract.id,
        date: '2022-02-02',
        discount: 0,
        type: 'discount',
        description: 'description',
        permanent: 0,
        discountType: 'fix',
        state: 'pending',
      };

      return Request.post(endpoint())
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .then(async (response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(201);
          expect(response.body.data.tpvCode).not.toBeNull();
          expect(response.body.data.tpvCode).not.toBe('');
        });
    });

    it('have to create `gf-discount-history` after discount creation', async () => {
      const contract = await GfContract.create({});

      const body = {
        contractId: contract.id,
        date: '2022-02-02',
        discount: 0,
        type: 'discount',
        description: 'description',
        permanent: 0,
        discountType: 'fix',
        state: 'pending',
      };

      return Request.post(endpoint())
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .then(async (response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(201);

          const recordMovement = await GfDiscountsHistory.findOne({
            where: {
              scheduledId: response.body.data.id,
              previousRow: null,
              action: 'scheduled',
              amount: null,
            },
          });

          expect(recordMovement).not.toBeNull();
        });
    });

    it('have to create `invoice-product` after discount creation', async () => {
      const contract = await GfContract.create({});

      const body = {
        contractId: contract.id,
        date: '2022-02-02',
        discount: 0,
        type: 'discount',
        description: 'description',
        permanent: 0,
        discountType: 'fix',
        state: 'pending',
      };

      return Request.post(endpoint())
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .then(async (response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(201);

          const invoiceProduct = await InvoiceProduct.findOne({
            where: {
              code: response.body.data.tpvCode,
            },
          });

          expect(invoiceProduct).not.toBeNull();
        });
    });
  });
});
// Negetive test gtoup
describe('Negetive Tests', () => {
  describe('Security Tests', () => {
    // 1. check authorization
    it('have to return 403 for unauthorized request', () => {
      return Request.post(endpoint())
        .expect(403)
        .expect((res) => {
          expect(res.headers['content-type']).toMatch(/application\/json/);
        });
    });
    // 2. check ACL
    it.todo('prevent operation for invalid user');
  });
  describe('Validation Tests', () => {
    it('have to error 400 for invalid contractId', async () => {
      const body = {
        contractId: 1,
        date: '2022-02-02',
        discount: 0,
        type: 'discount',
        description: 'description',
        permanent: 0,
        discountType: 'fix',
        state: 'pending',
      };

      return Request.post(endpoint())
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .expect((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(400);
          expect(response.body.errors).toMatchObject({});
          expect(response.body.errors.contractId.length).not.toBe(0);
        });
    });

    it('have to error 400 for percentage discount more than 100', async () => {
      const contract = await GfContract.create({});
      const body = {
        contractId: contract.id,
        date: '2022-02-02',
        discount: 100.1,
        type: 'discount',
        description: 'description',
        permanent: 0,
        discountType: 'percentage',
        state: 'pending',
      };

      return Request.post(endpoint())
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
  describe('Edge-case Tests', () => {});
  describe('Opertaion Tests', () => {});
});
