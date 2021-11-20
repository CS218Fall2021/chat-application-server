const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const util = require('util');
const { v4: uuidv4 } = require('uuid');
const index = require("./routes/index");
const cors = require('cors');
const {initializer} = require("./init");
const {appPort} = require("./config/config");
const {use} = require("express/lib/router");
const redisClient = initializer.getRedisClient();

const redisGetAsync = util.promisify(redisClient.get).bind(redisClient);

const app = express();
app.use(index);
app.use(cors());
const serverId = uuidv4();

const server = http.createServer(app);

const io = socketIo(server,  {
    cors: {
      origin: '*',
    }
});

redisClient.on('connect', function() {
    console.log('Connected!');
});

redisClient.on("error", function (err) {
    console.log("Error " + err);
});


// redisClient.subscribe("topic_" + serverId);
// redisClient.on('message', function(channel, message) {
//     io.emit(subscriber_key, JSON.parse(message));
// });

io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("UserIsOnline", ({userId, socketId}) => {
        let userDetails = {"socketId": socket.id, serverId, "c_socketId": socketId}
        redisClient.set(userId, JSON.stringify(userDetails));
        console.log("User connected: ", userDetails);
    });

    socket.on("UserIsGoingOffine", (userId) => {
         redisClient.del(userId)
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });

    // TODO
    function getUserIdList(convId) {
        let l = [];
        l.push(`${convId}`);
        return l;
    }

    socket.on("IncomingMessage", async ({userId, toSendUserId, message}) => {
        let convId = toSendUserId;
        console.log("message from : ", userId );
        console.log("message : ", message);
        console.log("toSendUserId : ", convId);
        userIdList = getUserIdList(convId)
        console.log(userIdList);
        redisClient.mget(userIdList, function (err, userDetailsList){
            let homeUserSocketIdList = [];
            let otherServerList = set();
            console.log(userDetailsList, Array.isArray(userDetailsList));
            console.log(err);
            let n = userDetailsList.length;
            for(let i=0;i<n;i++){
                let userDetails = JSON.parse(userDetailsList[i]);
                console.log(userDetails.serverId, serverId);
                if(userDetails.serverId === serverId){
                    homeUserSocketIdList.push(userDetails.c_socketId)
                }else{
                    otherServerList.add(userDetails.serverId)
                }
            }
            console.log("Sending message to: ",homeUserSocketIdList)
            socket.to(homeUserSocketIdList).emit('SendingMessage', {
                from: userId,
                to: convId,
                message: message
            });
            for (let serverId in otherServerList){
                redisClient.publish(serverId, {userId, convId, message})
            }
        })
    });
  });

  
  
server.listen(appPort, () => console.log(`Listening on port ${appPort}`));