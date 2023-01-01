const { GfDiscountsScheduled } = require('@models').allModels;
import Request from '@root/tests/Request';

const endpoint = (id) => `/api/v1/gf-discounts-scheduleds/${id}`;

jest.setTimeout(5 * 60 * 60 * 1000);

beforeEach(async () => GfDiscountsScheduled.destroy({ truncate: true }));

const createDiscount = async () => {
  return GfDiscountsScheduled.create({
    contractId: 1,
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
    it('have to return `gf-discount-scheduled` data', async () => {
      const discount = await createDiscount();

      return Request.get(endpoint(discount.id))
        .set('Authorization', await Request.authorization())
        .expect(200)
        .expect((response) => {
          const reponseBody = response.body.data;
          delete reponseBody.creationDate;
          delete reponseBody.updateDate;
          reponseBody.permanent = Number(reponseBody.permanent) > 0;

          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(200);
          expect(discount.get({ plain: true })).toMatchObject(reponseBody);
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
