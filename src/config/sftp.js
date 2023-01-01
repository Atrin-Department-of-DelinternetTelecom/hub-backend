'use strict';

module.exports = {
  host: process.env.SABADELL_SFTP_HOST,
  port: parseInt(process.env.SABADELL_SFTP_PORT, 10),
  username: process.env.SABADELL_SFTP_USERNAME,
  privateKey: process.env.SABADELL_SFTP_PRIVATE_KEY,
  remotePath: process.env.SABADELL_SFTP_DIR_PATH,
};
