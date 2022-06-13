import master from 'node:cluster';
import { EventEmitter } from 'node:events';
import { cpus } from 'node:os';
import { Client } from 'eris';
import logger from '../Utils/Logger.js';
import { Queue } from '../Utils/Queue.js';
import { Cluster } from './Cluster.js';

/**
 * Sharding Manager
 *
 * @class ShardingManager
 * @augments {EventEmitter}
 */
export class ShardingManager extends EventEmitter {
  /**
   * Sharder options
   *
   * @param {object} options
   * @param {string} options.mainFile
   * @param {string} options.token
   * @param {boolean} options.stats
   * @param {object} options.webhooks
   * @param {object} options.webhooks.shard
   * @param {string} options.webhooks.shard.id
   * @param {string} options.webhooks.shard.token
   * @param {object} options.webhooks.shard.embed
   * @param {object} options.webhooks.cluster
   * @param {string} options.webhooks.cluster.id
   * @param {string} options.webhooks.cluster.token
   * @param {object} options.webhooks.cluster.embed
   * @param {import('eris').ClientOptions} options.clientOptions
   * @param {number} options.clusters
   * @param {number} options.clusterTimeout
   * @param {number} options.shards
   * @param {number} options.firstShardID
   * @param {number} options.lastShardID
   * @param {boolean} options.debug
   * @param {number} options.statsInterval
   * @param {number} options.guildsPerShard
   * @param {boolean} options.noConsoleOveride
   */
  constructor(options) {
    super();
    this.shardCount = options.shards || 'auto';
    this.firstShardID = options.firstShardID || 0;
    this.lastShardID = options.lastShardID || 0;
    this.clusterCount = options.clusters || cpus().length;
    this.clusterTimeout = options.clusterTimeout * 1000 || 5000;
    this.token = options.token || false;
    this.clusters = new Map();
    this.workers = new Map();
    this.queue = new Queue();
    this.callbacks = new Map();
    this.options = {
      debug: options.debug || false,
      stats: options.stats || false,
    };
    this.statsInterval = options.statsInterval || 60 * 1000;
    this.guildsPerShard = options.guildsPerShard || 1300;
    this.noConsoleOveride = options.noConsoleOveride || false;
    this.webhooks = {
      cluster: undefined,
      shard: undefined,
      ...options.webhooks,
    };
    this.clientOptions = options.clientOptions || {};
    if (options.stats === true) {
      this.stats = {
        clustersCounted: 0,
        stats: {
          clusters: [],
          exclusiveGuilds: 0,
          guilds: 0,
          largeGuilds: 0,
          totalRam: 0,
          users: 0,
          voice: 0,
        },
      };
    }

    if (options.mainFile) {
      this.mainFile = options.mainFile;
    } else {
      throw new Error('No file path provided');
    }

    if (this.token) {
      this.eris = new Client(options.token);
    } else {
      throw new Error('No token provided');
    }
  }

  isMaster() {
    return master.isPrimary;
  }

  startStats() {
    if (this.statsInterval !== null) {
      setInterval(() => {
        this.stats.stats.guilds = 0;
        this.stats.stats.users = 0;
        this.stats.stats.totalRam = 0;
        this.stats.stats.clusters = [];
        this.stats.stats.voice = 0;
        this.stats.stats.exclusiveGuilds = 0;
        this.stats.stats.largeGuilds = 0;
        this.stats.clustersCounted = 0;

        const clusters = Object.entries(master.workers);

        this.executeStats(clusters, 0);
      }, this.statsInterval);
    }
  }

  /**
   * Stats to execute
   *
   * @param {*} clusters
   * @param {*} start
   */
  executeStats(clusters, start) {
    const clusterToRequest = clusters.filter(cluster => {
      return cluster[1].state === 'online';
    })[start];
    if (clusterToRequest) {
      const clusterRequest = clusterToRequest[1];

      clusterRequest.send({ name: 'stats' });

      this.executeStats(clusters, start + 1);
    }
  }

  /**
   * Start cluster
   *
   * @param {number} clusterID
   */
  start(clusterID) {
    if (clusterID === this.clusterCount) {
      logger.info('Manager', 'Clusters have been launched!');

      const shards = [];

      for (let index = this.firstShardID; index <= this.lastShardID; index++) {
        shards.push(index);
      }

      const chunkedShards = this.chunk(shards, this.clusterCount);

      for (const [clusterId, chunk] of chunkedShards.entries()) {
        const cluster = this.clusters.get(clusterId);

        this.clusters.set(
          clusterId,
          Object.assign(cluster, {
            firstShardID: Math.min(...chunk),
            lastShardID: Math.max(...chunk),
          })
        );
      }

      this.connectShards();
    } else {
      const worker = master.fork();
      this.clusters.set(clusterID, { workerID: worker.id });
      this.workers.set(worker.id, clusterID);
      logger.info('Manager', `Launching cluster ${clusterID}`);
      // eslint-disable-next-line no-param-reassign
      clusterID += 1;

      this.start(clusterID);
    }
  }

  spawn() {
    if (!this.token) throw new Error('No token was provided');
    if (master.isPrimary) {
      process.on('uncaughtException', error => {
        logger.error('Manager', error.stack);
      });

      process.nextTick(async () => {
        logger.sillyInfo('Manager', 'Cluster & Sharding Manager has started!');

        if (this.shardCount === 'auto') {
          const shards = await this.calculateShards();
          this.shardCount = shards;
        }

        if (this.lastShardID === 0) this.lastShardID = this.shardCount - 1;

        logger.info(
          'Manager',
          `Starting ${this.shardCount} shards in ${this.clusterCount} clusters`
        );

        const embed = {
          title: `Starting ${this.shardCount} shards in ${this.clusterCount} clusters`,
        };

        this.sendWebhook('cluster', embed);

        master.setupPrimary({
          silent: false,
        });

        // Fork workers.
        this.start(0);
      });
    } else if (master.isWorker) {
      const ClusterS = new Cluster();
      ClusterS.spawn();
    }

    // eslint-disable-next-line complexity
    master.on('message', async (worker, message) => {
      if (message.name) {
        const clusterID = this.workers.get(worker.id);

        // eslint-disable-next-line default-case
        switch (message.name) {
          case 'log':
            if (!this.noConsoleOveride)
              logger.log(`Cluster ${clusterID}`, `${message.msg}`);
            else console.log(`${message.msg}`);
            break;
          case 'debug':
            if (this.options.debug) {
              if (!this.noConsoleOveride)
                logger.debug(`Cluster ${clusterID}`, `${message.msg}`);
              else console.debug(`${message.msg}`);
            }

            break;
          case 'info':
            if (!this.noConsoleOveride)
              logger.info(`Cluster ${clusterID}`, `${message.msg}`);
            else console.info(`${message.msg}`);
            break;
          case 'warn':
            if (!this.noConsoleOveride)
              logger.warn(`Cluster ${clusterID}`, `${message.msg}`);
            else console.warn(`${message.msg}`);
            break;
          case 'error':
            if (!this.noConsoleOveride)
              logger.error(`Cluster ${clusterID}`, `${message.msg}`);
            else console.error(`${message.msg}`);
            break;
          case 'shardsStarted':
            this.queue.queue.splice(0, 1);

            if (this.queue.queue.length > 0) {
              setTimeout(() => {
                return this.queue.executeQueue();
              }, this.clusterTimeout);
            }

            break;
          case 'cluster':
            this.sendWebhook('cluster', message.embed);
            break;
          case 'shard':
            this.sendWebhook('shard', message.embed);
            break;
          case 'stats': {
            this.stats.stats.guilds += message.stats.guilds;
            this.stats.stats.users += message.stats.users;
            this.stats.stats.voice += message.stats.voice;
            this.stats.stats.totalRam += message.stats.ram;
            const ram = message.stats.ram / 1000000;
            this.stats.stats.exclusiveGuilds += message.stats.exclusiveGuilds;
            this.stats.stats.largeGuilds += message.stats.largeGuilds;
            this.stats.stats.clusters.push({
              cluster: clusterID,
              exclusiveGuilds: message.stats.exclusiveGuilds,
              guilds: message.stats.guilds,
              largeGuilds: message.stats.largeGuilds,
              ram,
              shards: message.stats.shards,
              shardsStats: message.stats.shardsStats,
              uptime: message.stats.uptime,
              voice: message.stats.voice,
            });

            this.stats.clustersCounted += 1;

            if (this.stats.clustersCounted === this.clusters.size) {
              const compare = function (a, b) {
                if (a.cluster < b.cluster) return -1;
                if (a.cluster > b.cluster) return 1;
                return 0;
              };

              const clusters = this.stats.stats.clusters.sort(compare);

              this.emit('stats', {
                clusters,
                exclusiveGuilds: this.stats.stats.exclusiveGuilds,
                guilds: this.stats.stats.guilds,
                largeGuilds: this.stats.stats.largeGuilds,
                totalRam: this.stats.stats.totalRam / 1000000,
                users: this.stats.stats.users,
                voice: this.stats.stats.voice,
              });
            }

            break;
          }

          case 'fetchUser':
            this.fetchInfo(0, 'fetchUser', message.id);
            this.callbacks.set(message.id, clusterID);
            break;
          case 'fetchGuild':
            this.fetchInfo(0, 'fetchGuild', message.id);
            this.callbacks.set(message.id, clusterID);
            break;
          case 'fetchChannel':
            this.fetchInfo(0, 'fetchChannel', message.id);
            this.callbacks.set(message.id, clusterID);
            break;
          case 'fetchMember':
            this.fetchInfo(0, 'fetchMember', [message.guildID, message.memberID]);
            this.callbacks.set(message.memberID, clusterID);
            break;
          case 'fetchReturn': {
            console.log(message);
            const callback = this.callbacks.get(message.value.id);

            const cluster = this.clusters.get(callback);

            if (cluster) {
              master.workers[cluster.workerID].send({
                id: message.value.id,
                name: 'fetchReturn',
                value: message.value,
              });
              this.callbacks.delete(message.value.id);
            }

            break;
          }

          case 'broadcast':
            this.broadcast(0, message.msg);
            break;
          case 'send':
            this.sendTo(message.cluster, message.msg);
            break;
          case 'apiRequest': {
            let response;
            let error;

            const { method, url, auth, body, file, _route, short } = message;

            if (file && file.file) file.file = Buffer.from(file.file, 'base64');

            try {
              response = await this.eris.requestHandler.request(
                method,
                url,
                auth,
                body,
                file,
                _route,
                short
              );
            } catch (cError) {
              error = {
                code: cError.code,
                message: cError.message,
                stack: cError.stack,
              };
            }

            if (error) {
              this.sendTo(clusterID, {
                _eventName: `apiResponse.${message.requestID}`,
                err: error,
              });
            } else {
              this.sendTo(clusterID, {
                _eventName: `apiResponse.${message.requestID}`,
                data: response,
              });
            }

            break;
          }
        }
      }
    });

    master.on('disconnect', worker => {
      const clusterID = this.workers.get(worker.id);
      logger.warn('Manager', `cluster ${clusterID} disconnected`);
    });

    master.on('exit', (worker, code, signal) => {
      this.restartCluster(worker, code, signal);
    });

    this.queue.on('execute', item => {
      const cluster = this.clusters.get(item.item);

      if (cluster) {
        master.workers[cluster.workerID].send(item.value);
      }
    });
  }

  /**
   *
   * @param {*} shards
   * @param {*} clusterCount
   * @returns
   */
  chunk(shards, clusterCount) {
    if (clusterCount < 2) return [shards];

    const length = shards.length;
    const out = [];
    let index = 0;
    let size;

    if (length % clusterCount === 0) {
      size = Math.floor(length / clusterCount);

      while (index < length) {
        out.push(shards.slice(index, (index += size)));
      }
    } else {
      while (index < length) {
        // eslint-disable-next-line no-param-reassign
        size = Math.ceil((length - index) / clusterCount--);
        out.push(shards.slice(index, (index += size)));
      }
    }

    return out;
  }

  connectShards() {
    const length = this.clusterCount;
    // eslint-disable-next-line guard-for-in
    for (let clusterID in [...Array.from({ length }).keys()]) {
      clusterID = Number.parseInt(clusterID, 10);

      const cluster = this.clusters.get(clusterID);

      if (!Object.prototype.hasOwnProperty.call(cluster, 'firstShardID')) break;

      this.queue.queueItem({
        item: clusterID,
        value: {
          clientOptions: this.clientOptions,
          clusterCount: this.clusterCount,
          file: this.mainFile,
          firstShardID: cluster.firstShardID,
          id: clusterID,
          lastShardID: cluster.lastShardID,
          maxShards: this.shardCount,
          name: 'connect',
          token: this.token,
        },
      });
    }

    logger.info('Manager', `All shards spread`);

    if (this.stats) {
      this.startStats();
    }
  }

  /**
   * Send webhooks
   *
   * @param {*} type
   * @param {*} embed
   * @returns
   */
  sendWebhook(type, embed) {
    if (!this.webhooks || !this.webhooks[type]) return;
    const id = this.webhooks[type].id;
    const token = this.webhooks[type].token;
    const embedAuthor = this.webhooks[type].embed?.author;
    const embedFooter = this.webhooks[type].embed?.footer;
    const embedColor = this.webhooks[type].embed?.color;
    const embedImage = this.webhooks[type].embed?.image;
    const embedThumbnail = this.webhooks[type].embed?.thumbnail;
    const embedFields = this.webhooks[type].embed?.fields;
    const embedTimestamp = this.webhooks[type].embed?.timestamp;
    if (embedAuthor) embed.author = embedAuthor;
    if (embedFooter) embed.footer = embedFooter;
    if (embedColor) embed.color = embedColor;
    if (embedImage) embed.image = embedImage;
    if (embedThumbnail) embed.thumbnail = embedThumbnail;
    if (embedFields) embed.fields = embedFields;
    if (embedTimestamp) embed.timestamp = embedTimestamp;
    if (id && token) {
      this.eris.executeWebhook(id, token, { embeds: [embed] });
    }
  }

  /**
   * Restart cluster
   *
   * @param {*} worker
   * @param {*} code
   */
  restartCluster(worker, code) {
    const clusterID = this.workers.get(worker.id);

    logger.warn('Manager', `cluster ${clusterID} died`);

    const cluster = this.clusters.get(clusterID);

    const embed = {
      description: `Shards ${cluster.firstShardID} - ${cluster.lastShardID}`,
      title: `Cluster ${clusterID} died with code ${code}. Restarting...`,
    };

    this.sendWebhook('cluster', embed);

    const shards = cluster.shardCount;

    const newWorker = master.fork();

    this.workers.delete(worker.id);

    this.clusters.set(clusterID, Object.assign(cluster, { workerID: newWorker.id }));

    this.workers.set(newWorker.id, clusterID);

    logger.debug('Manager', `Restarting cluster ${clusterID}`);

    this.queue.queueItem({
      item: clusterID,
      value: {
        clientOptions: this.clientOptions,
        clusterCount: this.clusterCount,
        file: this.mainFile,
        firstShardID: cluster.firstShardID,
        id: clusterID,
        lastShardID: cluster.lastShardID,
        maxShards: this.shardCount,
        name: 'connect',
        shards,
        test: this.test,
        token: this.token,
      },
    });
  }

  async calculateShards() {
    let shards = this.shardCount;

    const result = await this.eris.getBotGateway();
    shards = result.shards;

    if (shards === 1) {
      return shards;
    } else {
      const guildCount = shards * 1000;
      const guildsPerShard = this.guildsPerShard;
      const shardsDecimal = guildCount / guildsPerShard;
      const finalShards = Math.ceil(shardsDecimal);
      return finalShards;
    }
  }

  /**
   * Fetch information
   *
   * @param {*} start
   * @param {*} type
   * @param {*} value
   */
  fetchInfo(start, type, value) {
    const cluster = this.clusters.get(start);
    if (cluster) {
      master.workers[cluster.workerID].send({ name: type, value });
      this.fetchInfo(start + 1, type, value);
    }
  }

  /**
   * Broadcast message
   *
   * @param {*} start
   * @param {*} message
   */
  broadcast(start, message) {
    const cluster = this.clusters.get(start);
    if (cluster) {
      master.workers[cluster.workerID].send(message);
      this.broadcast(start + 1, message);
    }
  }

  /**
   * Send message to cluster
   *
   * @param {*} cluster
   * @param {*} message
   */
  sendTo(cluster, message) {
    const worker = master.workers[this.clusters.get(cluster).workerID];
    if (worker) {
      worker.send(message);
    }
  }
}
