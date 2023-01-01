const shell = require('shelljs');

//set env as developement
shell.exec('export NODE_ENV=development & set NODE_PATH=development');

//start system with passed roles - app.json
shell.exec('nodemon -r ts-node/register src/app.js');
