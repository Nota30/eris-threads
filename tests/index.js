import { ShardingManager } from '../src/index.js';

const shardManager = new ShardingManager('/tests/main.js', {
  clientOptions: {
    defaultImageFormat: 'png',
    messageLimit: 150,
  },
  clusters: 2,
  clusterTimeout: 6,
  debug: true,
  guildsPerShard: 1,
  noConsoleOveride: false,
  shards: 3,
  stats: true,
  statsInterval: 120,
  token: 'botToken',
  webhooks: {
    cluster: {
      embed: {
        color: 0x008000,
        image: {
          url: 'https://cdn.mos.cms.futurecdn.net/ufTfK2rbpQXZBjt2ZPsm57-320-80.jpg',
        },
        timestamp: new Date(),
      },
      id: 'webhookID',
      token: 'webhookToken',
    },
    shard: {
      embed: {
        color: 0x008000,
      },
      id: 'webhookID',
      token: 'webhookToken',
    },
  },
});

shardManager.spawn();
