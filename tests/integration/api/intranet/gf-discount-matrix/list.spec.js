const {
  allModels: { GfDiscountsMatrix },
} = require('@models');

import Request from '@root/tests/Request';

const endpoint = () => `/api/v1/gf-discount-matrices`;

beforeEach(async () => GfDiscountsMatrix.destroy({ truncate: true }));

const createDiscountMatrices = async () => {
  return Promise.all([
    GfDiscountsMatrix.create({
      id: 1,
      discount: 0,
      discountType: 'fix',
      alias: 'validation tests',
      idTpv: 'test',
    }),
    GfDiscountsMatrix.create({
      id: 2,
      discount: 0,
      discountType: 'fix',
      alias: 'validation tests',
      idTpv: 'test',
    }),
    GfDiscountsMatrix.create({
      id: 3,
      discount: 0,
      discountType: 'fix',
      alias: 'validation tests',
      idTpv: 'test',
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
    it('have to return `gf-discount-matrix` data', async () => {
      const discounts = await createDiscountMatrices();

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
              const data = discount.get({ plain: true });

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
