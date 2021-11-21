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

const ConversationRouter = require("./routes/ConversationRouter");
const MessageRouter = require("./routes/MessageRouter");
const UserRouter = require("./routes/UserRouter");

const redisGetAsync = util.promisify(redisClient.get).bind(redisClient);

const serverId = uuidv4();
const app = express();
app.use(index);
app.use(cors());
app.use("/conversation", ConversationRouter);
app.use("/message", MessageRouter);
app.use("/user", UserRouter);
app.use(express.json());
app.use(function(req, res, next) {
    res.setHeader("Content-Type", "application/json");
    next();
});

app.get('/', function(req,res) {
    res.json({'message': 'ok'});
});

const server = http.createServer(app);

const io = socketIo(server,  {
    cors: {
      origin: '*',
    }
});

redisClient.subscribe("topic_" + serverId);
redisClient.on('message', function(channel, packetStr) {
    let packet = JSON.parse(packetStr);

});

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

    socket.on("IncomingMessage", async ({userId, convId, message}) => {
        redisClient.get("conv:"+convId, function (err, userIdListStr){
            let userIdList = JSON.parse(userIdListStr);
            redisClient.mget(userIdList, function (err, userDetailsList){
                let homeUserSocketIdList = [];
                let otherServerList = set();
                let n = userDetailsList.length;
                for(let i=0;i<n;i++){
                    let userDetails = JSON.parse(userDetailsList[i]);
                    if(userDetails.serverId === serverId){
                        homeUserSocketIdList.push(userDetails.c_socketId)
                    }else{
                        otherServerList.add(userDetails.serverId)
                    }
                }
                socket.to(homeUserSocketIdList).emit('SendingMessage', {
                    from: userId,
                    to: convId,
                    message: message
                });
                for (let serverId in otherServerList){
                    redisClient.publish(serverId, JSON.stringify({userId, convId, message}));
                }
            })
        })
    });
  });

  
  
server.listen(appPort, () => console.log(`Listening on port ${appPort}`));