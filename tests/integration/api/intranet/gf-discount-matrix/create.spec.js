const {
  allModels: {
    GfDiscountsMatrix,
    GfDiscountsMatrixExclusion,
    GfFeegroupsGroupLabel,
  },
} = require('@models');

import Request from '@root/tests/Request';

const endpoint = () => `/api/v1/gf-discount-matrices`;

jest.setTimeout(5 * 60 * 60 * 1000);

beforeEach(async () =>
  Promise.all([
    GfFeegroupsGroupLabel.destroy({ truncate: true }),
    GfDiscountsMatrix.destroy({ truncate: true }),
    GfDiscountsMatrixExclusion.destroy({ truncate: true }),
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
      const feeGroupLabel = await GfFeegroupsGroupLabel.create({});

      const body = {
        discount: 0,
        discountType: 'fix',
        alias: 'validation tests',
        feeGroupLabelId: feeGroupLabel.id,
        idTpv: 'test',
      };

      return Request.post(endpoint())
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .then((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(201);
          expect(response.body.data).toMatchObject(body);
        });
    });
  });
  describe('Edge-case Tests', () => {});
  describe('Opertaion Tests', () => {
    it('have to create `gf-discount-matrix` by valid inputs', async () => {
      const feeGroupLabel = await GfFeegroupsGroupLabel.create({});

      const body = {
        discount: 0.0,
        discountType: 'fix',
        alias: 'validation tests',
        feeGroupLabelId: feeGroupLabel.id,
        idTpv: 'test',
      };

      return Request.post(endpoint())
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .then(async (response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(201);
          expect(response.body.data).toMatchObject(body);

          const discountRecord = await GfDiscountsMatrix.findByPk(
            response.body.data.id,
          );

          expect(discountRecord).not.toBeNull();
          expect(discountRecord).toMatchObject(body);
        });
    });

    it('have to attach `gf-discount-matrix-exclusion`', async () => {
      const feeGroupLabel = await GfFeegroupsGroupLabel.create({});
      const exclusion = await GfDiscountsMatrixExclusion.create({});

      const body = {
        discount: 0.0,
        discountType: 'fix',
        alias: 'validation tests',
        feeGroupLabelId: feeGroupLabel.id,
        idTpv: 'test',
      };

      return Request.post(endpoint())
        .set('Authorization', await Request.authorization())
        .send({ ...body, exclusion: [exclusion.id] })
        .expect(200)
        .then((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(201);
          expect(response.body.data).toMatchObject(body);
          expect(response.body.data.matrixExclusion).toMatchObject([
            { id: exclusion.id },
          ]);
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
    it('have to error 400 for invalid groupLabelId', async () => {
      const body = {
        discount: 0.0,
        discountType: 'fix',
        alias: 'validation tests',
        feeGroupLabelId: -1,
        idTpv: 'test',
      };

      return Request.post(endpoint())
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .then((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(400);
          expect(response.body.errors).toMatchObject({});
          expect(response.body.errors.feeGroupLabelId.length).not.toBe(0);
        });
    });
    it('have to error 400 for missing groupLabelId', async () => {
      const body = {
        discount: 0.0,
        discountType: 'fix',
        alias: 'validation tests',
        idTpv: 'test',
      };

      return Request.post(endpoint())
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .then((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(400);
          expect(response.body.errors).toMatchObject({});
          expect(response.body.errors.feeGroupLabelId.length).not.toBe(0);
        });
    });

    it('have to error 400 for invalid bonoId', async () => {
      const feeGroupLabel = await GfFeegroupsGroupLabel.create({});

      const body = {
        discountType: 'bono',
        alias: 'validation tests',
        idTpv: 'test',
        feeGroupLabelId: feeGroupLabel.id,
        bonoId: -1,
      };

      return Request.post(endpoint())
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .then((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(400);
          expect(response.body.errors).toMatchObject({});
          expect(response.body.errors.bonoId.length).not.toBe(0);
        });
    });

    it('have to error 400 for missing bonoId', async () => {
      const feeGroupLabel = await GfFeegroupsGroupLabel.create({});

      const body = {
        discountType: 'bono',
        alias: 'validation tests',
        idTpv: 'test',
        feeGroupLabelId: feeGroupLabel.id,
      };

      return Request.post(endpoint())
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .then((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(400);
          expect(response.body.errors).toMatchObject({});
          expect(response.body.errors.bonoId.length).not.toBe(0);
        });
    });

    it('have to error 400 for percentage discount more than 100', async () => {
      const feeGroupLabel = await GfFeegroupsGroupLabel.create({});

      const body = {
        discount: 100.01,
        discountType: 'percentage',
        alias: 'validation tests',
        feeGroupLabelId: feeGroupLabel.id,
        idTpv: 'test',
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
