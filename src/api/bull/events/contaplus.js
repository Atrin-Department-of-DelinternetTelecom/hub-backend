'use strict';

const q = require('@utils/bull').getBullQ('contaplus');
const wsJobData = require('@utils/bull').wsJobData;

q.on('global:completed', async (jobId, result) => {
  const job = await q.getJob(jobId);
  const { title, date, _meta } = job.data;
  _meta._response = 'job-completed';
  wsJobData(job, { contaplus: result });
})
  .on('global:error', async (error) => {})

  .on('global:progress', async (jobId, progress) => {
    const job = await q.getJob(jobId);
    const { title, date, _meta } = job.data;
    _meta._response = 'progress';
    wsJobData(job, { progress });
  })

  .on('global:failed', async (jobId, err) => {
    const job = await q.getJob(jobId);
    const { title, date, _meta } = job.data;
    _meta._response = 'job-failed';
    wsJobData(job, { error: err });
  });
