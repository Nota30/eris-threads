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
  shards: 3,
  stats: true,
  statsInterval: 120,
  token: 'token',
});

shardManager.spawn();
