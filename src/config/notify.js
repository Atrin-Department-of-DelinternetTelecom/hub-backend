'use strict';

module.exports = {
  callMe: {
    message:
      process.env.CALLME_NOTIFY_MESSAGE ??
      '☎️ ☎️ ☎️\n<b>Sol·licitud de trucada</b>\n\n<b>Usuario</b>: {{name}}\n<b>Comentari</b>: {{{description}}}\n\n<a href="https://hub.delinternet.com/r?type=callme&id={{id}}"><b>Feu clic aquí per gestionar-ho</b></a>',
    apiKey: process.env.CALLME_NOTIFY_API_KEY,
    channel: process.env.CALLME_NOTIFY_CHANNEL,
  },
};
