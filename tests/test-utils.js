'use strict';
const fs = require('fs/promises');
const path = require('path');

exports.initDb = async function initDb(initData) {
  const { allModels } = require('@models');
  for (const modelName in initData) {
    const model = allModels[modelName];
    if (!model) {
      throw new Error(`model ${modelName} not found`);
    }

    let value = initData[modelName];
    if (!Array.isArray(value)) {
      value = [value];
    }

    await model.destroy({
      where: {},
      truncate: true,
      force: true,
    });

    if (value.length === 0) continue;

    await model.bulkCreate(value);
  }
};

exports.readImageAsSwaggerFile = async function readImageAsSwaggerFile(
  fileName,
) {
  const absolutePath = path.resolve(__dirname, 'files', fileName);

  const file = await fs.readFile(absolutePath);
  return {
    ...file,
    data: file,
    mimetype: `image/${path.extname(absolutePath).substring(1)}`,
    name: fileName,
    encoding: '7bit',
    mv: function () {},
    tempFilePath: '',
    truncated: false,
    md5: 'abc',
    size: file.length,
  };
};
