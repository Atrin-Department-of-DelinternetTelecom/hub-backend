'use strict';

const path = require('path');

module.exports = {
  serves: [
    {
      path:
        process.env.STATIC_UPLOAD_PATH || path.join(process.cwd(), 'uploads'),
      uri: process.env.STATIC_UPLOAD_URL || '/uploads',
    },
    {
      path: 'uploads',
      // url: process.env.STATIC_UPLOAD_URL || '/uploads',
    },
    {
      uri: '/uploads/:filename',
      bucket: 'GlobalMedia',
    },
    {
      uri: '/conversions/:filename',
      bucket: 'GlobalMedia/Conversion',
    },
    {
      uri: '/uploads/messages/:filename',
      bucket: 'GlobalMedia',
    },
    {
      uri: '/uploads/incidences/:filename',
      bucket: 'GlobalMedia',
    },
    {
      uri: '/uploads/assistances/:filename',
      bucket: 'GlobalMedia',
    },
    {
      uri: '/uploads/client-avatar/:filename',
      bucket: 'ClientCommentAvatar',
    },
  ],
};
