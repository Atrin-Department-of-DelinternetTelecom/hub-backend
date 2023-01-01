'use strict';

module.exports = {
  port: process.env.SOCKET_IO_PORT || 8007, // public port listen, change also in views/default/demo.js
  example: true, // router -> http://localhost:8000/socket
  admin_user: process.env.SOCKETIO_ADMIN_USER || 'admin',
  admin_pass: process.env.SOCKETIO_ADMIN_PASS || 'pass',
};
