// redisClient.js
var redis = require('redis');
import url from 'url'

var redis_url = process.env.REDIS_URL ? url.parse(process.env.REDIS_URL) : url.parse("redis://localhost:6379/passaporte");
var redisClient = redis.createClient({url:redis_url}); // replace with your config

redisClient.on('error', function(err) {
    console.log('Redis error: ' + err);
}); 

module.exports = redisClient;
