const { GfDiscountsMatrix } = require('@models').allModels;
import Request from '@root/tests/Request';

const endpoint = (id) => `/api/v1/gf-discount-matrices/${id}`;

beforeEach(async () => GfDiscountsMatrix.destroy({ truncate: true }));

const createDiscountMatrix = async () => {
  return GfDiscountsMatrix.create({
    discount: 0,
    discountType: 'fix',
    alias: 'validation tests',
    idTpv: 'test',
  });
};

// Positive test group ('Happy path tests)
describe('Positive Tests', () => {
  describe('Security Tests', () => {
    // 1. check authorization
    it('have to return 200 for authorized request', async () => {
      const discount = await createDiscountMatrix();

      return Request.get(endpoint(discount.id))
        .set('Authorization', await Request.authorization())
        .expect((res) => {
          expect(res.headers['content-type']).toMatch(/application\/json/);
        })
        .expect(200);
    });
    // 2. check ACL
    it.todo('should pass operation access');
  });
  describe('Validation Tests', () => {});
  describe('Edge-case Tests', () => {
    it('have to return 404 for not exists discount', async () => {
      return Request.get(endpoint(-1))
        .set('Authorization', await Request.authorization())
        .expect(200)
        .expect((res) => expect(res.body.code).toBe(404));
    });
  });
  describe('Opertaion Tests', () => {
    it('have to return `gf-discount-matrix` data', async () => {
      const discount = await createDiscountMatrix();

      return Request.get(endpoint(discount.id))
        .set('Authorization', await Request.authorization())
        .expect(200)
        .expect((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(200);
          expect(response.body.data).toMatchObject({
            accumulation: 0,
            active: false,
            alias: 'validation tests',
            bonoId: 0,
            discount: 0,
            discountType: 'fix',
            feeGroupId: 0,
            feeGroupLabelId: 0,
            idTpv: 'test',
            numberOfMonths: 0,
            order: 0,
            stay: 0,
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
        .expect((res) => {
          expect(res.headers['content-type']).toMatch(/application\/json/);
        });
    });
    // 2. check ACL
    it.todo('prevent operation for invalid user');
  });
  describe('Validation Tests', () => {});
  describe('Edge-case Tests', () => {
    it('have to return 500 for undefined discount id', async () => {
      return Request.get(endpoint())
        .set('Authorization', await Request.authorization())
        .expect(200)
        .expect((response) => {
          expect(response.body.code).toBe(400);
        });
    });
  });
  describe('Opertaion Tests', () => {});
});
