const redis = require("redis");
const {redis_endpoint} = require("./config/redisconfig");

Initializer = function (){
    console.log("Initializing Application...")
    this.redisClient = redis.createClient(redis_endpoint);
    console.log("Application Initialized Successfully...")
}
Initializer.prototype.getRedisClient = function (){
    return this.redisClient
}
initializer = new Initializer()
exports.initializer = initializer
exports.getRedisClient = function (){
    return initializer.getRedisClient()
}