# eris-threads

# About

eris-threads is a powerful sharding and cluster manager for the discord Eris library. It uses Node.js's cluster module to spread shards evenly among all the cores. Eris-threads is based on [eris-sharder](https://github.com/discordware/eris-sharder) (an updated version)

# Installation and usage

To download eris-threads, run `npm install eris-threads --save`

To use eris-threads, simply copy this code and place it in a file, in the same directory that you ran the npm install in:

```javascript
const { ShardingManager } = require('eris-threads');
const sharder = new ShardingManager(token, pathToMainFile, options);
```

## Options

| Name                     | Description                                                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token`                  | your discord bot token. It will be used to calculate how many shards to spawn and to pass it on to your main file.                                          |
| `pathToMainFile`         | path to a file that exports a class. The class must containt a method called "launch". In the constructor the only paramater you should put is for the bot. |
| `options.stats`          | boolean. When set to true it enables stats output.                                                                                                          |
| `options.webhooks`       | Object.`{shard: {id: "webhookID", token: "webhookToken"}, cluster:{id: "webhookID", token: "webhookToken"}}`                                                |
| `options.clientOptions`  | A object of client options you want to pass to the Eris client constructor.                                                                                 |
| `options.clusters`       | The number of how many clusters you want. Defaults to the amount of threads                                                                                 |
| `options.clusterTimeout` | Number of seconds between starting up clusters. Values lower than 5 may lead to an Invalid Session on first shard.                                          |
| `options.shards`         | The number of total shards you plan to run. Defaults to the amount that the gateway reccommends, taking into account `options.guildsPerShard`               |
| `options.firstShardID`   | ID of the first shard to start on this instance. Defaults to `0`                                                                                            |
| `options.lastShardID`    | ID of the last shard to start on this instance. Defaults to `options.shards - 1`                                                                            |
| `options.debug`          | Boolean to enable debug logging.                                                                                                                            |
| `options.statsInterval`  | Interval to release the stats event in milliseconds. Defaults to every minute                                                                               |
| `options.guildsPerShard` | Number to calculate how many guilds per shard. Defaults to 1300. Overriden if you only have 1 shard.                                                        |

# IPC

eris-threads supports a variety of IPC events. All IPC events can be used via `process.send({type: "event"});`

## Logging

eris-threads supports the following IPC logging events.

| Name  | Example                                          | Description                      |
| ----- | ------------------------------------------------ | -------------------------------- |
| log   | `process.send({name: "log", msg: "example"});`   | Logs to console with gray color. |
| info  | `process.send({name: "info", msg: "example"});`  | Logs to console in green color.  |
| debug | `process.send({name: "debug", msg: "example"});` | Logs to console in cyan color.   |
| warn  | `process.send({name: "warn", msg: "example"});`  | Logs to console in yellow color. |
| error | `process.send({name: "error", msg: "example"});` | Logs to console in red color.    |

## Info

In every cluster when your code is loaded, if you extend the Base class you get access to `this.bot`, `this.clusterID`, and `this.ipc`. `this.ipc` has a couple methods which you can find very useful.

| Name         | Example                                   | Description                                                                           |
| ------------ | ----------------------------------------- | ------------------------------------------------------------------------------------- |
| register     | `this.ipc.register(event, callback);`     | Using this you can register to listen for events and a callback that will handle them |
| unregister   | `this.ipc.unregister(event);`             | Use this to unregister for an event                                                   |
| broadcast    | `this.ipc.broadcast(name, message);`      | Using this you can send a custom message to every cluster                             |
| sendTo       | `this.ipc.sendTo(cluster, name, message)` | Using this you can send a message to a specific cluster                               |
| fetchUser    | `await this.ipc.fetchUser(id)`            | Using this you can search for a user by id on all clusters                            |
| fetchGuild   | `await this.ipc.fetchGuild(id)`           | Using this you can search for a guild by id on all clusters                           |
| fetchChannel | `await this.ipc.fetchChannel(id)`         | Using this you can search for a channel by id on all clusters                         |

# Example

## Directory Tree

In this example the directory tree will look something like this:

```
Project/
├── node-modules/
│   ├── eris-threads
|
├── src/
│   ├── main.js
│
├── index.js
```

## Example of main.js

```javascript
const { Base } = require('eris-threads');
class Class extends Base {
  constructor(bot) {
    super(bot);
  }

  launch() {}
}

module.exports = Class;
```

## Example of index.js

```javascript
const { ShardingManager } = require('eris-threads');
const sharder = new ShardingManager('someToken', '/src/main.js', {
  stats: true,
  debug: true,
  guildsPerShard: 1500,
  webhooks: {
    shard: {
      id: 'webhookID',
      token: 'webhookToken',
    },
    cluster: {
      id: 'webhookID',
      token: 'webhookToken',
    },
  },
  clientOptions: {
    messageLimit: 150,
    defaultImageFormat: 'png',
  },
});

sharder.on('stats', stats => {
  console.log(stats);
});
```

## Starting the script

```
node index.js
```

## NOTICE

If you are using pm2 to run your script add the `-- --colors` option to enable the colorful logging.
