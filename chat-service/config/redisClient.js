const redis = require('redis');

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

redisClient.connect()
  .then(() => console.log('✅ Redis connected'))
  .catch(err => console.error('Redis connection error:', err));

module.exports = redisClient;

