const {initializer} = require("../server/init");
const {v4: uuidv4} = require("uuid");

test_redis_connection = function (){
    console.log("Running test_redis_connection")
    let redisClient = initializer.getRedisClient();
    const TEST_VALUE = "CS218FA21"
    redisClient.set(1, TEST_VALUE);
    redisClient.get(1, function(err, val) {
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

test_cache = function () {
    convId = '71d79abf-2099-44f6-8137-be37e617e3ab';
    redisClient = initializer.getRedisClient();
    con = initializer.getSQLConn();
    redisClient.get("" + convId, function (err, reply) {
        let userIdList;
        if (err || !reply) {
            con.query("SELECT *  FROM conversation_table WHERE cid = ?", convId, function (err, resultSet) {
                if (!err) {
                    userIdList = [];
                    for (let i = 0; i < resultSet.length; i++) {
                        userIdList.push(resultSet[i].user_id);
                    }
                    redisClient.set("" + convId, JSON.stringify(userIdList));
                    oper(userIdList)
                }
            });
        } else {
            userIdList = JSON.parse(reply);
            oper(userIdList)
        }
    })
    let oper = (userIdList) => {
        redisClient.mget(userIdList, function (err, userDetailsList) {
            console.log("Success:", userDetailsList)
        })
    }
}

let redisClient = initializer.getRedisClient();
let serverId = 123;
redisClient.psubscribe("wtf");
redisClient.on('message', function(channel, packetStr) {
    console.log(packetStr);
});
redisClient.publish("topic", "Hello Packet!");
