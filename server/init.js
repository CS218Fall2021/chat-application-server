const redis = require("redis");
const {redis_endpoint} = require("./config/redisconfig");
const mysql = require("mysql");
const db = require("./config/database");

Initializer = function (){
    console.log("Initializing Application...")
    this.redisClient = redis.createClient(redis_endpoint);
    this.con = mysql.createConnection({
        host: db.host,
        user: db.username,
        password: db.password,
        port: "3306",
        database: db.database
    });
    this.con.connect(function(err) {
        console.log("Connected to RDS!");
    });
    console.log("Application Initialized Successfully...")
}
Initializer.prototype.getRedisClient = function (){
    return this.redisClient
}
Initializer.prototype.getSQLConn = function (){
    return this.con;
}
initializer = new Initializer()
exports.initializer = initializer