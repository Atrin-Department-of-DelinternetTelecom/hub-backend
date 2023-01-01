const {
  allModels: {
    GfContract,
    GfDiscountsHistory,
    GfDiscountsScheduled,
    InvoiceProduct,
  },
} = require('@models');
const moment = require('moment');
import Request from '@root/tests/Request';

const endpoint = () => `/api/v1/gf-discounts-massive`;

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
        .expect(200)
        .then((res) => {
          expect(res.headers['content-type']).toMatch(/application\/json/);
        });
    });
    // 2. check ACL
    it.todo('should pass operation access');
  });
  describe('Validation Tests', () => {
    it('have to pass validation for minimum valid inputs', async () => {
      const contract = await GfContract.create({});

      const body = {
        contractId: contract.id,
        dateInit: moment().format('YYYY-MM-DD'),
        dateEnd: moment().add(1, 'months').format('YYYY-MM-DD'),
        discount: 0,
        type: 'discount',
        description: 'description',
        discountType: 'fix',
      };

      return Request.post(endpoint())
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .expect((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(200);
        });
    });
  });
  describe('Edge-case Tests', () => {
    it('have to create `gf-discount-scheduled` for less than one month', async () => {
      const contract = await GfContract.create({});

      const body = {
        contractId: contract.id,
        dateInit: moment().format('YYYY-MM-DD'),
        dateEnd: moment().add(1, 'days').format('YYYY-MM-DD'),
        discount: 0,
        type: 'discount',
        description: 'description',
        discountType: 'fix',
        userId: 1,
      };

      const response = await Request.post(endpoint())
        .set('Authorization', await Request.authorization())
        .send(body);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body.code).toBe(200);

      const discounts = await GfDiscountsScheduled.findAll({});
      expect(discounts.length).toBe(1);

      const histories = await GfDiscountsHistory.findAll({
        where: { action: 'scheduled' },
      });
      expect(histories.length).toBe(1);

      const invoiceProduct = await InvoiceProduct.findOne({
        where: { code: discounts[0].tpvCode },
      });
      expect(invoiceProduct).not.toBeNull();
    });
  });
  describe('Opertaion Tests', () => {
    it('have to create `gf-discount-scheduled` for random months', async () => {
      const contract = await GfContract.create({});
      const months = Math.floor(Math.random() * 12) || 1;

      const body = {
        contractId: contract.id,
        dateInit: moment().format('YYYY-MM-DD'),
        dateEnd: moment()
          .add(months, 'months')
          .subtract(1, 'days')
          .format('YYYY-MM-DD'),
        discount: 0,
        type: 'discount',
        description: 'description',
        discountType: 'fix',
        userId: 1,
      };

      const response = await Request.post(endpoint())
        .set('Authorization', await Request.authorization())
        .send(body);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body.code).toBe(200);

      const discounts = await GfDiscountsScheduled.findAll({});
      expect(discounts.length).toBe(months);

      const histories = await GfDiscountsHistory.findAll({
        where: { action: 'scheduled' },
      });
      expect(histories.length).toBe(months);

      const invoiceProduct = await InvoiceProduct.findOne({
        where: { code: discounts[0].tpvCode },
      });
      expect(invoiceProduct).not.toBeNull();
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
    it('have to error 400 for percentage discount more than 100', async () => {
      const contract = await GfContract.create({});

      const body = {
        contractId: contract.id,
        dateInit: moment().format('YYYY-MM-DD'),
        dateEnd: moment()
          .add(1, 'months')
          .subtract(2, 'days')
          .format('YYYY-MM-DD'),
        discount: 100.1,
        type: 'discount',
        description: 'description',
        discountType: 'percentage',
      };

      return Request.post(endpoint())
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .expect((response) => {
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
