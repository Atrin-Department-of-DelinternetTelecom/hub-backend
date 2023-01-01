'use strict';

const { InvoiceNumera, InvoiceSerie, transaction } =
  require('@models').intranet;
const to = require('await-to-js').default;

exports.getNextCode = async (type, serieId, ignoreTransaction = false) => {
  if (ignoreTransaction) {
    return getNextCodeFunc(type, serieId);
  }
  const [error, result] = await to(
    transaction(async (t) => {
      return getNextCodeFunc(type, serieId, t);
    }),
  );
  if (error) throw error;
  return result;
};

const getNextCodeFunc = async (type, serieId, t = undefined) => {
  const serie = await getSerie(serieId, type);
  let row = await InvoiceNumera.findOne({
    where: {
      type,
      serieId: serie.id,
    },
    lock: true,
    transaction: t,
  });

  if (!row) {
    row = await InvoiceNumera.create(
      {
        type: type,
        serieId: serie.id,
        value: 0,
        uid: 90,
      },
      { lock: true, transaction: t },
    );
  }
  row.value++;
  await row.save({ transaction: t });

  const code = exports.buildCode(serie.prefix, row.value);

  return {
    code: code,
    value: row.value,
    serieId: serie.id,
  };
};

const getSerie = async (serieId, type) => {
  const serie = await InvoiceSerie.findByPk(serieId);
  if (serie) return serie;

  if (serieId < 0) return getInverseSerie(-serieId);

  return exports.getDefaultSerie(type);
};

const getInverseSerie = async (serieId) => {
  const inverseId = serieId * -1;
  let serie = await InvoiceSerie.findByPk(inverseId);
  if (!serie) {
    const normalSerie = await InvoiceSerie.findByPk(serieId);

    if (!normalSerie) {
      throw new Error('Getting inverse serie of non existing serie (77787)');
    }

    try {
      serie = await InvoiceSerie.create({
        prefix: 'R' + normalSerie.prefix,
        name: normalSerie.name,
        id: serieId * -1,
        type: normalSerie.type,
      });
    } catch (e) {
      console.log(e);
      throw new Error("Can't get invoice serie (22)");
    }
  }
  return serie;
};

exports.getDefaultSerie = async (type) => {
  const defPrefix = {
    budget: 'PR',
    invoice: 'A',
    payment: 'PAY',
  }[type];

  const serie = await InvoiceSerie.findOne({
    where: {
      prefix: defPrefix,
      type: type,
    },
  });

  if (serie) return serie;

  try {
    return await InvoiceSerie.create({
      name: 'Default',
      prefix: defPrefix,
      type: type,
    });
  } catch (e) {
    console.log(e);
    throw new Error("Can't get invoice serie (22)");
  }
};

const zeroPad = (num, places) => String(num).padStart(places, '0');
exports.buildCode = (prefix, value) => prefix + '/' + zeroPad(value, 7);
