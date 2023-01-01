### Delinternet Hub - Nodejs Api


#### Run MySQL docker container

```bash
 docker run --name hub-mysql -p 3306:3306 -v /home/mostafa/hub-database:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=root -d mysql:latest  

```



#### Run Redis docker container


```bash

docker run -p 6379:6379 --name hub-redis -d redis


```


#### Run Migrations
before running migrations you have 
to install `sequelize-cli` and `sequelize` globaly
remember that we are using customer `sequelize` module
in the node_modules_custom - so do not install `sequelize`
using package.json.

```bash

sequelize

```



line 1378 of file `node_modules_custom\sequelize\lib\dialects\abstract\query-generator.js` has been change - (added isGlobalLimit)




### Jobs - Bull
For defining a new job you have declare some files and 
events.
Job main folder is under `src/api/bull` that can be accessable 
by the `require('@bull')` but you have to remember that for using
this type of path you have to require `require('module-alias/register');` module alias - but by default this module has been 
require in the main `app.js` but for other processes you have 
to require it in the first line of code.
for creating a job there is two main folders under the 
bull that called proccessed and workers
the proccessed folder contains `queue.proccess()` function 
that will be run on seperated proccesses using pm2 or simple 
node proccess and workers are some global events that will listen to
queues for events like `progress` ,`compeleted`...

there is a sample code in the test.js in worker folder that is sending progress through websocket to the user to show the progress of work

every job contains some info in _meta property that 
will be attached to the start job
```json
{
    _command: 'new-job',
    _response: 'job-complete',
    _user: '<user_object>',
    _model: 'User',
    _page: 'new-user',
    _model_id: 10
}
```
all of this information can be provided by the dashboard to 
send it back to the dashboard to know that this event is related to which job



## DEVELOPEMENT MODE 
TASKS related to unpaid service has been disabled here 
in cluster mode