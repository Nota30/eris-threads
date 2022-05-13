import console from 'node:console';
import process from 'node:process';
import { setInterval } from 'node:timers';
import { inspect } from 'node:util';
import Eris from 'eris';
import Base from '../Shard/Base.js';
import IPC from '../Shard/Ipc.js';
import RequestHandler from '../Shard/RequestHandler.js';

/**
 * Manage Clusters
 *
 * @class Cluster
 */
export default class Cluster {
  constructor() {
    this.shards = 0;
    this.maxShards = 0;
    this.firstShardID = 0;
    this.lastShardID = 0;
    this.mainFile = null;
    this.clusterID = 0;
    this.clusterCount = 0;
    this.guilds = 0;
    this.users = 0;
    this.uptime = 0;
    this.exclusiveGuilds = 0;
    this.largeGuilds = 0;
    this.voiceChannels = 0;
    this.shardsStats = [];
    this.app = null;
    this.bot = null;
    this.test = false;

    this.ipc = new IPC();

    console.log = string_ => {
      return process.send({ msg: this.logOverride(string_), name: 'log' });
    };

    console.error = string_ => {
      return process.send({ msg: this.logOverride(string_), name: 'error' });
    };

    console.warn = string_ => {
      return process.send({ msg: this.logOverride(string_), name: 'warn' });
    };

    console.info = string_ => {
      return process.send({ msg: this.logOverride(string_), name: 'info' });
    };

    console.debug = string_ => {
      return process.send({ msg: this.logOverride(string_), name: 'debug' });
    };
  }

  /**
   * Logs
   *
   * @param {string} message
   * @returns
   */
  logOverride(message) {
    if (typeof message === 'object') return inspect(message);
    else return message;
  }

  spawn() {
    process.on('uncaughtException', error => {
      process.send({ msg: error.stack, name: 'error' });
    });

    process.on('unhandledRejection', (reason, promise) => {
      process.send({
        msg: `Unhandled rejection at: Promise  ${promise} reason:  ${reason.stack}`,
        name: 'error',
      });
    });

    // eslint-disable-next-line complexity
    process.on('message', message => {
      if (message.name) {
        // eslint-disable-next-line default-case
        switch (message.name) {
          case 'connect': {
            this.firstShardID = message.firstShardID;
            this.lastShardID = message.lastShardID;
            this.mainFile = message.file;
            this.clusterID = message.id;
            this.clusterCount = message.clusterCount;
            this.shards = this.lastShardID - this.firstShardID + 1;
            this.maxShards = message.maxShards;

            if (this.shards < 1) return;

            if (message.test) {
              this.test = true;
            }

            this.connect(
              message.firstShardID,
              message.lastShardID,
              this.maxShards,
              message.token,
              'connect',
              message.clientOptions
            );

            break;
          }

          case 'stats': {
            process.send({
              name: 'stats',
              stats: {
                exclusiveGuilds: this.exclusiveGuilds,
                guilds: this.guilds,
                largeGuilds: this.largeGuilds,
                ram: process.memoryUsage().rss,
                shards: this.shards,
                shardsStats: this.shardsStats,
                uptime: this.uptime,
                users: this.users,
                voice: this.voiceChannels,
              },
            });

            break;
          }

          case 'fetchUser': {
            if (!this.bot) return;
            const id = message.value;
            const user = this.bot.users.get(id);
            if (user) {
              process.send({ name: 'fetchReturn', value: user });
            }

            break;
          }

          case 'fetchChannel': {
            if (!this.bot) return;
            const id = message.value;
            let channel = this.bot.getChannel(id);
            if (channel) {
              channel = channel.toJSON();
              process.send({ name: 'fetchReturn', value: channel });
            }

            break;
          }

          case 'fetchGuild': {
            if (!this.bot) return;
            const id = message.value;
            let guild = this.bot.guilds.get(id);
            if (guild) {
              guild = guild.toJSON();
              process.send({ name: 'fetchReturn', value: guild });
            }

            break;
          }

          case 'fetchMember': {
            if (!this.bot) return;
            const [guildID, memberID] = message.value;

            const guild = this.bot.guilds.get(guildID);

            if (guild) {
              let member = guild.members.get(memberID);

              if (member) {
                member = member.toJSON();
                process.send({ name: 'fetchReturn', value: member });
              }
            }

            break;
          }

          case 'fetchReturn':
            this.ipc.emit(message.id, message.value);
            break;
          case 'restart':
            process.exit(1);
            break;
        }
      }
    });
  }

  /**
   * Connect to discord
   *
   * @param {number} firstShardID
   * @param {number} lastShardID
   * @param {number|string} maxShards
   * @param {string} token
   * @param {*} type
   * @param {object} clientOptions
   */
  connect(firstShardID, lastShardID, maxShards, token, type, clientOptions) {
    process.send({ msg: `Connecting with ${this.shards} shard(s)`, name: 'log' });

    const options = {
      autoreconnect: true,
      firstShardID,
      lastShardID,
      maxShards,
    };
    const optionsOb = Object.keys(options);
    for (const key of optionsOb) {
      delete clientOptions[key];
    }

    Object.assign(options, clientOptions);

    const bot = new Eris(token, options);
    this.bot = bot;

    this.bot.requestHandler = new RequestHandler(this.ipc, {
      timeout: this.bot.options.requestTimeout,
    });

    bot.on('connect', id => {
      process.send({ msg: `Shard ${id} established connection!`, name: 'log' });
    });

    bot.on('shardDisconnect', (_error, id) => {
      process.send({ msg: `Shard ${id} disconnected!`, name: 'log' });
      const embed = {
        description: `Shard ${id} disconnected!`,
        title: 'Shard Status Update',
      };
      process.send({ embed, name: 'shard' });
    });

    bot.on('shardReady', id => {
      process.send({ msg: `Shard ${id} is ready!`, name: 'log' });
      const embed = {
        description: `Shard ${id} is ready!`,
        title: 'Shard Status Update',
      };
      process.send({ embed, name: 'shard' });
    });

    bot.on('shardResume', id => {
      process.send({ msg: `Shard ${id} has resumed!`, name: 'log' });
      const embed = {
        description: `Shard ${id} resumed!`,
        title: 'Shard Status Update',
      };
      process.send({ embed, name: 'shard' });
    });

    bot.on('warn', (message, id) => {
      process.send({ msg: `Shard ${id} | ${message}`, name: 'warn' });
    });

    bot.on('error', (error, id) => {
      process.send({ msg: `Shard ${id} | ${error.stack}`, name: 'error' });
    });

    bot.once('ready', () => {
      this.loadCode(bot);

      this.startStats(bot);
    });

    bot.on('ready', () => {
      process.send({
        msg: `Shards ${this.firstShardID} - ${this.lastShardID} are ready!`,
        name: 'log',
      });
      const embed = {
        description: `Shards ${this.firstShardID} - ${this.lastShardID}`,
        title: `Cluster ${this.clusterID} is ready!`,
      };
      process.send({ embed, name: 'cluster' });

      process.send({ name: 'shardsStarted' });
    });

    if (!this.test) {
      bot.connect();
    } else {
      process.send({ name: 'shardsStarted' });
      this.loadCode(bot);
    }
  }

  async loadCode(bot) {
    let rootPath = process.cwd();
    rootPath = rootPath.replace(`\\`, '/');

    const path = `${rootPath}${this.mainFile}`;
    let app = await import(path);
    if (app.default !== undefined) app = app.default;
    if (app.prototype instanceof Base) {
      this.app = new app({ bot, clusterID: this.clusterID, ipc: this.ipc });
      this.app.launch();
    } else {
      console.error(
        'Your code has not been loaded! This is due to it not extending the Base class. Please extend the Base class!'
      );
    }
  }

  startStats(bot) {
    setInterval(() => {
      this.guilds = bot.guilds.size;
      this.users = bot.users.size;
      this.uptime = bot.uptime;
      this.voiceChannels = bot.voiceConnections.size;
      this.largeGuilds = bot.guilds.filter(guild => {
        return guild.large;
      }).length;
      this.exclusiveGuilds = bot.guilds.filter(guild => {
        return (
          guild.members.filter(member => {
            return member.bot;
          }).length === 1
        );
      }).length;
      this.shardsStats = [];
      for (const shard of this.bot.shards) {
        this.shardsStats.push({
          id: shard.id,
          latency: shard.latency,
          ready: shard.ready,
          status: shard.status,
        });
      }
    }, 1000 * 5);
  }
}
