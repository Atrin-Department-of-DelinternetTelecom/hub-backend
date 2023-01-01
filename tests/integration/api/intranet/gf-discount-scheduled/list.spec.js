const {
  allModels: { GfDiscountsScheduled },
} = require('@models');

import Request from '@root/tests/Request';

const endpoint = () => `/api/v1/gf-discounts-scheduleds`;

jest.setTimeout(5 * 60 * 60 * 1000);

beforeEach(async () => GfDiscountsScheduled.destroy({ truncate: true }));

const createDiscounts = async () => {
  return Promise.all([
    GfDiscountsScheduled.create({
      id: 1,
      contractId: 1,
      date: '2022-02-02',
      discount: 0,
      type: 'discount',
      description: 'description',
      permanent: 0,
      discountType: 'fix',
      state: 'pending',
      userId: 1,
    }),
    GfDiscountsScheduled.create({
      id: 2,
      contractId: 2,
      date: '2022-02-02',
      discount: 0,
      type: 'discount',
      description: 'description',
      permanent: 0,
      discountType: 'fix',
      state: 'pending',
      userId: 1,
    }),
    GfDiscountsScheduled.create({
      id: 3,
      contractId: 3,
      date: '2022-02-02',
      discount: 0,
      type: 'discount',
      description: 'description',
      permanent: 0,
      discountType: 'fix',
      state: 'pending',
      userId: 1,
    }),
  ]);
};

// Positive test group ('Happy path tests)
describe('Positive Tests', () => {
  describe('Security Tests', () => {
    // 1. check authorization
    it('have to return 200 for authorized request', async () => {
      return Request.get(endpoint())
        .set('Authorization', await Request.authorization())
        .expect((res) => {
          expect(res.headers['content-type']).toMatch(/application\/json/);
        })
        .expect(200)
        .then((response) => {
          expect(response.body).toMatchObject({
            code: 200,
            data: [],
            meta: { current_page: 1, total: 0 },
          });
        });
    });
    // 2. check ACL
    it.todo('should pass operation access');
  });
  describe('Validation Tests', () => {});
  describe('Edge-case Tests', () => {});
  describe('Opertaion Tests', () => {
    it('have to return `gf-discount-scheduled` data', async () => {
      const discounts = await createDiscounts();

      return Request.get(endpoint())
        .set('Authorization', await Request.authorization())
        .expect((res) => {
          expect(res.headers['content-type']).toMatch(/application\/json/);
        })
        .expect(200)
        .then((response) => {
          expect(response.body).toMatchObject({
            code: 200,
            data: discounts.map((discount) => {
              const data = {
                ...discount.get({ plain: true }),
                permanent: discount.permanent ? 1 : 0,
              };

              delete data.creationDate;
              delete data.updateDate;

              return data;
            }),
            meta: { current_page: 1, total: 3 },
          });
        });
    });
  });
});
// Negetive test gtoup
describe('Negetive Tests', () => {
  describe('Security Tests', () => {
    // 1. check authorization
    it('have to return 403 for unauthorized request', () => {
      return Request.get(endpoint())
        .expect(403)
        .then((res) => {
          expect(res.headers['content-type']).toMatch(/application\/json/);
        });
    });
    // 2. check ACL
    it.todo('prevent operation for invalid user');
  });
  describe('Validation Tests', () => {});
  describe('Edge-case Tests', () => {});
  describe('Opertaion Tests', () => {});
});
