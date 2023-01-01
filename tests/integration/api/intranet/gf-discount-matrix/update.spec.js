const {
  allModels: {
    GfDiscountsMatrix,
    GfDiscountsMatrixExclusion,
    GfFeegroupsGroupLabel,
  },
} = require('@models');

import Request from '@root/tests/Request';

const endpoint = (id) => `/api/v1/gf-discount-matrices/${id}`;

beforeEach(async () =>
  Promise.all([
    GfFeegroupsGroupLabel.destroy({ truncate: true }),
    GfDiscountsMatrix.destroy({ truncate: true }),
    GfDiscountsMatrixExclusion.destroy({ truncate: true }),
  ]),
);

const sampleValidBody = () => {
  return {
    discount: 0,
    discountType: 'fix',
    alias: 'validation tests',
    idTpv: 'test',
  };
};
const createDiscountMatrix = async () => {
  return GfDiscountsMatrix.create(sampleValidBody());
};

// Positive test group ('Happy path tests)
describe('Positive Tests', () => {
  describe('Security Tests', () => {
    // 1. check authorization
    it('have to return 200 for authorized request', async () => {
      const discountMatrix = await createDiscountMatrix();

      return Request.put(endpoint(discountMatrix.id))
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
      const discountMatrix = await createDiscountMatrix();

      return Request.put(endpoint(discountMatrix.id))
        .set('Authorization', await Request.authorization())
        .send({})
        .expect(200)
        .then((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(200);
          expect(response.body.data).toMatchObject(sampleValidBody());
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
    it('have to update `gf-discount-matrix` by valid inputs', async () => {
      const discountMatrix = await createDiscountMatrix();
      const feeGroupLabel = await GfFeegroupsGroupLabel.create({});

      const body = {
        ...sampleValidBody(),
        feeGroupLabelId: feeGroupLabel.id,
      };

      return Request.put(endpoint(discountMatrix.id))
        .set('Authorization', await Request.authorization())
        .send(body)
        .expect(200)
        .then(async (response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(200);
          expect(response.body.data).toMatchObject(body);
          // ensure that database is up to date
          const discountRecord = await GfDiscountsMatrix.findByPk(
            response.body.data.id,
          );

          expect(discountRecord).not.toBeNull();
          expect(discountRecord).toMatchObject(body);
        });
    });

    it('have to attach `gf-discount-matrix-exclusion`', async () => {
      const discountMatrix = await createDiscountMatrix();
      const exclusion = await GfDiscountsMatrixExclusion.create({});

      return Request.put(endpoint(discountMatrix.id))
        .set('Authorization', await Request.authorization())
        .send({ exclusion: [exclusion.id] })
        .expect(200)
        .then((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(200);
          expect(response.body.data).toMatchObject(sampleValidBody());
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
    it('have to error 400 for invalid groupLabelId', async () => {
      const discountMatrix = await createDiscountMatrix();

      return (
        Request.put(endpoint(discountMatrix.id))
          .set('Authorization', await Request.authorization())
          .send({ feeGroupLabelId: -1 })
          // .expect(200)
          .then((response) => {
            expect(response.headers['content-type']).toMatch(
              /application\/json/,
            );
            expect(response.body.code).toBe(400);
            expect(response.body.errors).toMatchObject({});
            expect(response.body.errors.feeGroupLabelId.length).not.toBe(0);
          })
      );
    });

    it('have to error 400 for invalid bonoId', async () => {
      const discountMatrix = await createDiscountMatrix();

      return Request.put(endpoint(discountMatrix.id))
        .set('Authorization', await Request.authorization())
        .send({ bonoId: -1, discountType: 'bono' })
        .expect(200)
        .then((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(400);
          expect(response.body.errors).toMatchObject({});
          expect(response.body.errors.bonoId.length).not.toBe(0);
        });
    });

    it('have to error 400 for missing bonoId', async () => {
      const discountMatrix = await createDiscountMatrix();

      return Request.put(endpoint(discountMatrix.id))
        .set('Authorization', await Request.authorization())
        .send({ discountType: 'bono' })
        .expect(200)
        .then((response) => {
          expect(response.headers['content-type']).toMatch(/application\/json/);
          expect(response.body.code).toBe(400);
          expect(response.body.errors).toMatchObject({});
          expect(response.body.errors.bonoId.length).not.toBe(0);
        });
    });

    it('have to error 400 for percentage discount more than 100', async () => {
      const discountMatrix = await createDiscountMatrix();
      const body = {
        discount: 100.1,
        discountType: 'percentage',
      };

      return Request.put(endpoint(discountMatrix.id))
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
    it('have to return 500 for undefined matrix id', async () => {
      return Request.put(endpoint())
        .set('Authorization', await Request.authorization())
        .send({})
        .expect(200)
        .expect((response) => expect(response.body.code).toBe(400));
    });
  });
  describe('Opertaion Tests', () => {});
});
