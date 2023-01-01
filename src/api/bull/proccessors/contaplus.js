// 'use strict';

// (async () => {
//   //start db connections
//   await require('@lib/sequelize').connect();
// })();

// const Contaplus = require('@service/intranet/ContaplusService');
// const q = require('@utils/bull').getBullQ('contaplus');
// const path = require('path');
// const config = require('@config');
// const fs = require('fs/promises');

// const fun = async (job) => {
//   try {
//     console.log('started');
//     const { file_path, pId } = job.data;
//     const fpath = path.resolve(config.get('index.root'), file_path);
//     const file = await fs.readFile(fpath);
//     const res = await Contaplus.sepaContaplus(file, pId, true, undefined, job);
//     return { res };
//   } catch (error) {
//     console.log(error);
//     throw error;
//   }
// };

// q.process(fun);
