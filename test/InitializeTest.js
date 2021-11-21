const {initializer} = require("../server/init");

test_redis_connection = function (){
    console.log("Running test_redis_connection")
    let redisClient = initializer.getRedisClient();
    const TEST_VALUE = "CS218FA21"
    redisClient.set("test", TEST_VALUE);
    redisClient.get('test', function(err, val) {
        console.log(val);
        if(TEST_VALUE===val){
            console.log("test_redis_connection successful");
        }else{
            console.log("test_redis_connection failed");
        }
    });
}
test_redis_mget = function (){
    console.log("Running test_redis_mget")
    let redisClient = initializer.getRedisClient();
    const TEST_VALUE_1 = "CS218FA21_1"
    const TEST_VALUE_2 = "CS218FA21_2"
    const TEST_VALUE_3 = "CS218FA21_3"
    redisClient.set("test1", TEST_VALUE_1);
    redisClient.set("test2", TEST_VALUE_2);
    redisClient.set("test3", TEST_VALUE_3);
    redisClient.mget(['test1','test2', 'test3'], function(err, val) {
        console.log(val);
    });
}