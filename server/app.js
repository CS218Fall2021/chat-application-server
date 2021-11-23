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
const moment = require("moment");

const serverId = uuidv4();
const app = express();
app.use(index);
app.use(cors({origin:"*", 
              credentials:true, 
              optionSuccessStatus:200,}));
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
//const io = socketIo(server,  {cors: {origin: 'http://34.228.156.100:3000'}});
const io = socketIo(server,  {
    cors: {  
        origin: 'http://34.228.156.100:3000',
        methods: ["GET", "POST"]
    }

});
const con = initializer.getSQLConn()

sendMessageToSubscribers = function (packet, userIdList){
    redisClient.mget(userIdList, function (err, userDetailsList){
        let homeUserSocketIdList = [];
        for(let i=0;i<userDetailsList.length;i++){
            let userDetails = JSON.parse(userDetailsList[i]);
            if(userDetails.serverId === serverId){
                homeUserSocketIdList.push(userDetails.socketId)
            }
        }
        if(homeUserSocketIdList.length>0){
            io.to(homeUserSocketIdList).emit('SendingMessage', {from: packet.senderId,to: packet.convId,message: packet.message})
        }
    })
}
let subscriber = initializer.getPubSubClient();
subscriber.subscribe("topic_" + serverId);
console.log("Subscribed to: ", "topic_" + serverId);
subscriber.on('message', function(channel, packetStr) {
    let packet = JSON.parse(packetStr);
    redisClient.get("conv:" + packet.convId, function (err, reply) {
        if (err || !reply) {
            con.query("SELECT *  FROM conversation_table WHERE cid = ?", packet.convId, function (err, resultSet) {
                if (!err) {
                    let userIdList = resultSet.map(v => v.user_id)
                    redisClient.set("conv:" + packet.convId, JSON.stringify(userIdList));
                    sendMessageToSubscribers(packet, userIdList);
                }
            });
        } else {
            let userIdList = JSON.parse(reply);
            sendMessageToSubscribers(packet, userIdList);
        }
    })
});

io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("UserIsOnline", ({userId, socketId}) => {
        let userDetails = {"socketId": socket.id, serverId}
        redisClient.set(""+userId, JSON.stringify(userDetails));
        console.log("User connected: ", userDetails);
    });

    socket.on("UserIsOffline", (userId) => {
        redisClient.del(userId)
    });

    socket.on("IncomingMessage", async (packet) => {
        const {senderId, convId, message} = packet;
        redisClient.get("conv:" + packet.convId, function (err, reply) {
            if (err || !reply) {
                con.query("SELECT *  FROM conversation_table WHERE cid = ?", convId , function (err, resultSet) {
                    if (!err) {
                        let userIdList = resultSet.map(v => v.user_id)
                        redisClient.set("conv:" + packet.convId, JSON.stringify(userIdList));
                        processMessage(userIdList, packet);
                    }
                });
            } else {
                let userIdList = JSON.parse(reply);
                processMessage(userIdList, packet);
            }
        })
    });
    let processMessage = function (userIdList, packet) {
        const {senderId, convId, message} = packet;
        redisClient.mget(userIdList, function (err, userDetailsList) {
            let homeUserSocketIdList = [];
            let otherServerList = new Set();
            //console.log("type of userdetailslist", typeof userDetailsList);
            for (let i = 0; i < userDetailsList.length; i++) {
                let userDetails = JSON.parse(userDetailsList[i]);
                if (userDetails.serverId === serverId) {
                    if (senderId !== userIdList[i]) {
                        homeUserSocketIdList.push(userDetails.socketId)
                    }
                } else {
                    otherServerList.add(userDetails.serverId)
                }
            }
            let ts = Math.floor(+new Date() / 1000);
            let mid = uuidv4()
            for (let socketId of homeUserSocketIdList) {
                io.to(socketId).emit('SendingMessage', {
                    from: senderId,
                    to: convId,
                    message: message,
                    timestamp: ts,
                    m_id: mid
                });
            }
            for (let otherServer of otherServerList) {
                redisClient.publish("topic_" + otherServer, JSON.stringify({senderId, convId, message}));
            }
            let body = {m_id: mid, cid: convId, sender_id: senderId, data: message, timestamp: ts, group: false}
            con.query("INSERT INTO message_table VALUES (?, ?, ?, ?, ?, ?)", [body.m_id, body.cid, body.sender_id, body.data, body.timestamp, body.group], function (err, result) {
                if (!err) {
                    console.log(result);
                }
            });
        })
    }
  });

server.listen(appPort, () => console.log(`Listening on port ${appPort}`));