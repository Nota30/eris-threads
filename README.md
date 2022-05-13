<div align="center">
  <h4><b>eris-threads</b></h4>
  <p>

<a href="https://github.com/abalabahaha/eris"><img src="https://img.shields.io/badge/Discord%20Library-Eris-blue?style=flat-square" alt="Discord Library" /></a>
<a href="https://www.npmjs.com/package/eris-threads"><img src="https://img.shields.io/npm/v/eris-threads.svg?cacheSeconds=3600&style=flat-square&label=version&logo=npm" alt="NPM version" /></a>

  </p>
  <p>
    <a href="https://www.npmjs.com/package/eris-threads/"><img src="https://nodeico.herokuapp.com/eris-threads.svg"></a>
  </p>
</div>

# About the package

Eris-threads is a sharding and cluster manager for discord bots based on [eris](https://abal.moe/Eris/). Eris-threads spreads shards evenly among your cores. Eris-threads is based on [eris-sharder](https://github.com/discordware/eris-sharder) (an updated version). **Supports CommonJS and ESM**.

# Installation

npm:

```
npm install eris-threads
```

yarn:

```
yarn add eris-threads
```

pnpm:

```
pnpm add eris-threads
```

## Sharding Manager Options

| Name                     | Type      | Description                                                                                                                                                       |
| ------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `token`                  | `string`  | A discord token                                                                                                                                                   |
| `pathToMainFile`         | `string`  | File path that exports the **Base** class. The class must containt a method called "launch". In the constructor the only paramater you should put is for the bot. |
| `options.stats`          | `boolean` | Enables stats output if `true`.                                                                                                                                   |
| `options.webhooks`       | `object`  | Webhook options to send to a channel. Example: `{shard: {id: "webhookID", token: "webhookToken"}, cluster:{id: "webhookID", token: "webhookToken"}}`              |
| `options.clientOptions`  | `object`  | Eris client options. You can find them [here](https://abal.moe/Eris/docs/0.16.1/Client)                                                                           |
| `options.clusters`       | `number`  | The number of clusters you want to spawn. Defaults to the amount of cores on your system                                                                          |
| `options.clusterTimeout` | `number`  | Number of seconds between starting up clusters. Values lower than 5 may lead to an Invalid Session on first shard.                                                |
| `options.shards`         | `number`  | The number of shards you want to spwan. Defaults gateway reccommendation, taking into account `options.guildsPerShard`                                            |
| `options.firstShardID`   | `number`  | ID of the first shard to start on this instance. Defaults to `0`                                                                                                  |
| `options.lastShardID`    | `number`  | ID of the last shard to start on this instance. Defaults to `options.shards - 1`                                                                                  |
| `options.debug`          | `boolean` | Boolean to enable debug logging.                                                                                                                                  |
| `options.statsInterval`  | `number`  | Interval to release the stats event in milliseconds. Defaults to every minute                                                                                     |
| `options.guildsPerShard` | `number`  | The number of guilds per shard. Defaults to 1300. Overriden if you only have 1 shard.                                                                             |

# IPC

All IPC events can be used via `process.send({type: "event"});`

## Logging

eris-threads supports the following IPC logging events:

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

## Starting your bot

```
node index.js
```
