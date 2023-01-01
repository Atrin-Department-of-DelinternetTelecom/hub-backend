//@ts-check
'use strict';
const path = require('path');

module.exports = {
  default: 'ftp',
  disks: {
    local: {
      driver: 'local',
      config: {
        root: process.cwd(),
      },
    },

    upload: {
      driver: 'local',
      public_url: '/uploads',
      config: {
        root: path.join(process.cwd(), 'uploads'),
      },
    },

    incidence: {
      driver: 'local',
      public_url: '/uploads/incidences',
      config: {
        root: path.join(process.cwd(), 'uploads', 'incidences'),
      },
    },

    assistance: {
      driver: 'local',
      public_url: '/uploads/assistances',
      config: {
        root: path.join(process.cwd(), 'uploads', 'assistances'),
      },
    },

    message: {
      driver: 'local',
      public_url: '/uploads/messages',
      config: {
        root: path.join(process.cwd(), 'uploads', 'messages'),
      },
    },

    ftp: {
      driver: 'ftp',
      config: {
        host: process.env.FTP_HOST,
        port: process.env.FTP_PORT || 21,
        username: process.env.FTP_USERNAME,
        password: process.env.FTP_PASSWORD,
      },
    },
  },
};
