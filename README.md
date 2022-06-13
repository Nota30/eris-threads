<div align="center">
  <h4><b>eris-threads</b></h4>
  <p>

<a href="https://github.com/abalabahaha/eris"><img src="https://img.shields.io/badge/Discord%20Library-Eris-blue?style=flat-square" alt="Discord Library" /></a>
<a href="https://www.npmjs.com/package/eris-threads"><img src="https://img.shields.io/npm/v/eris-threads.svg?cacheSeconds=3600&style=flat-square&label=version&logo=npm" alt="NPM version" /></a>

  </p>
  <p>
    <a href="https://www.npmjs.com/package/eris-threads/"><img src="https://nodei.co/npm/eris-threads.png?downloads=true&stars=true"></a>
  </p>
</div>

# About the package

Eris-threads is a sharding and cluster manager for discord bots based on [eris](https://abal.moe/Eris/). Eris-threads spreads shards evenly among your cores. Eris-threads is based on [eris-sharder](https://github.com/discordware/eris-sharder) (an updated version). **Supports CommonJS and ESM**.

*You can find examples and usage [here](https://github.com/Nota30/eris-threads/tree/main/tests).*

# Requirements
- [Node.js version 16+](https://nodejs.org/en/)
- [Eris version 0.17.0+](https://abal.moe/Eris/)

# Installation

npm:

```
npm install eris-threads eris
```

yarn:

```
yarn add eris-threads eris
```

pnpm:

```
pnpm add eris-threads eris
```

# Example

## Directory Tree

In this example the directory tree will look something like this:

```
Project/
├── node-modules/
│   ├── eris-threads
|
├── main.js
│
├── index.js
```

## Example of index.js

```javascript
const { ShardingManager } = require('eris-threads');

const shardManager = new ShardingManager({
  mainFile: '/main.js',
  token: 'botToken',
  stats: true,
  debug: true,
  guildsPerShard: 1500,
  webhooks: {
    shard: {
      id: 'webhookID',
      token: 'webhookToken',
      embed: {} // Custom embed if you wish
    },
    cluster: {
      id: 'webhookID',
      token: 'webhookToken',
      embed: {}
    },
  },
  clientOptions: {
    messageLimit: 150,
    defaultImageFormat: 'png',
  },
});

shardManager.spawn();
```

## Example of main.js

```javascript
const { Base } = require('eris-threads');

class Bot extends Base {
  constructor(bot) {
    super(bot);
  }
}

module.exports = Bot;
```
> You can start your bot using
```
node index.js
```

## Sharding Manager Options

| Name                     | Type      | Description                                                                                                                                                       |
| ------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options.mainFile`         | `string`  | File path that exports the **Base** class. The class must containt a method called "launch". In the constructor the only paramater you should put is for the bot. |
| `options.token`                  | `string`  | A discord bot  token                                                                                                                                                   |
| `options.stats`          | `boolean` | Enables stats output if `true`.                                                                                                                                   |
| `options.webhooks`       | `object`  | Webhook options to send to a channel. Example: `{shard: {id: "webhookID", token: "webhookToken"}, cluster:{id: "webhookID", token: "webhookToken"}}`              |
| `options.clientOptions`  | `object`  | Eris client options. You can find them [here](https://abal.moe/Eris/docs/0.16.1/Client)                                                                           |
| `options.clusters`       | `number`  | The number of clusters you want to spawn. Defaults to the amount of cores on your system                                                                          |
| `options.clusterTimeout` | `number`  | Number of seconds between starting up clusters. Values lower than 5 may lead to an Invalid Session on first shard.                                                |
| `options.shards`         | `number`  | The number of shards you want to spwan. Defaults gateway reccommendation, taking into account `options.guildsPerShard`                                            |
| `options.firstShardID`   | `number`  | ID of the first shard to start on this instance. Defaults to `0`                                                                                                  |
| `options.lastShardID`    | `number`  | ID of the last shard to start on this instance. Defaults to `options.shards - 1`                                                                                  |
| `options.debug`          | `boolean` | Boolean to enable debug logging.                                                                                                                                  |
| `options.noConsoleOveride`          | `boolean` | Boolean to disable or enable console overide. Default is `false`                                                                                                                                  |
| `options.statsInterval`  | `number`  | Interval to release the stats event in milliseconds. Defaults to every minute                                                                                     |
| `options.guildsPerShard` | `number`  | The number of guilds per shard. Defaults to 1300. Overriden if you only have 1 shard.                                                                             |

# Base

When you extend the Base class (main.js) you get access to `this.bot`, `this.clusterID`, and `this.ipc`

> `this.bot` is the eris client

> `this.clusterID` will return the cluster id.

## IPC Methods
| Name         | Example                                   | Description                                                                           |
| ------------ | ----------------------------------------- | ------------------------------------------------------------------------------------- |
| register     | `this.ipc.register(event, callback);`     | Using this you can register to listen for events and a callback that will handle them |
| unregister   | `this.ipc.unregister(event);`             | Use this to unregister for an event                                                   |
| broadcast    | `this.ipc.broadcast(name, message);`      | Using this you can send a custom message to every cluster                             |
| sendTo       | `this.ipc.sendTo(cluster, name, message)` | Using this you can send a message to a specific cluster                               |
| fetchUser    | `await this.ipc.fetchUser(id)`            | Using this you can search for a user by id on all clusters                            |
| fetchGuild   | `await this.ipc.fetchGuild(id)`           | Using this you can search for a guild by id on all clusters                           |
| fetchChannel | `await this.ipc.fetchChannel(id)`         | Using this you can search for a channel by id on all clusters                         |

