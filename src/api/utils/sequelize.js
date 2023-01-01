'use strict';
// ATTENTION: do not import anything from lib, services here!

/**
 * sync m to n relation (insert or delete based on array of ids)
 * here we are updating 1 to n
 * @param {Object} NtoMModel sequelize MtoN model to insent or remove records
 * @param {string} MColumn column name of first model (m)
 * @param {number} MModelId id of first Model
 * @param {string} NColumn column name of second model (n)
 * @param {Array<number>} NModelIds ids of second model
 */
exports.syncMtoN = async (NtoMModel, MColumn, MModelId, NColumn, NModelIds) => {
  if (NModelIds && Array.isArray(NModelIds)) {
    let where = {};
    where[MColumn] = parseInt(MModelId);
    const currentMtoNRecords = await NtoMModel.findAll({
      where,
    });

    const currentNColumsArray = currentMtoNRecords.map(
      (currentMtoNRecord) => currentMtoNRecord[NColumn],
    );
    const NtoMRecordsShouldAdd = NModelIds.filter(
      (NModelId) => !currentNColumsArray.includes(NModelId),
    );

    const NtoMRecordsShouldRemove = currentNColumsArray.filter(
      (NModelId) => !NModelIds.includes(NModelId),
    );

    where = {};
    where[NColumn] = NtoMRecordsShouldRemove;
    where[MColumn] = MModelId;
    await NtoMModel.update(
      {
        status: 0,
      },
      {
        where,
      },
    );
    await NtoMModel.bulkCreate(
      NtoMRecordsShouldAdd.map((NColumnId) => {
        where = {};
        where[NColumn] = NColumnId;
        where[MColumn] = MModelId;
        return where;
      }),
    );
  }
};

const stringify = (value) => {
  if (!value) return null;
  return JSON.stringify(value);
};

const parse = (value) => {
  if (!value) return null;
  return JSON.parse(value);
};

/**
 *
 * @param {{ name: string, defaultValue?: any }} param0
 * @returns {{ get: Function. set: Function }}
 */
exports.jsonSetterAndGetter = ({ name: fieldName, defaultValue }) => {
  return {
    get: function () {
      return parse(this.getDataValue(fieldName)) ?? defaultValue;
    },
    set: function (value) {
      this.setDataValue(fieldName, stringify(value ?? defaultValue));
    },
  };
};
