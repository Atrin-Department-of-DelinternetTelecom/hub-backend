// 'use strict';

// (async () => {
//   //start db connections
//   await require('@lib/sequelize').connect();
// })();

// const { Anviz } = require('@models').system;

// const test = require('@utils/bull').getBullQ('test');

// const testProcess = async (job) => {
//   try {
//     const { title, date } = job.data;
//     console.log(`${title} -> ${date}`);
//     job.progress(10);
//     console.log('job.progress(10);');
//     const anvizes = await Anviz.findAndCountAll({});
//     job.progress(20);
//     return Promise.resolve({ anvizes });
//   } catch (error) {
//     return Promise.reject(error);
//   }
// };

// test.process(testProcess);
