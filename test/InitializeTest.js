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
test_redis_connection();
