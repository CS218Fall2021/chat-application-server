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
const io = socketIo(server,  {cors: {origin: '*',}});
const con = initializer.getSQLConn()

let subscriber = initializer.getPubSubClient();
subscriber.subscribe("topic_" + serverId);
console.log("Subscribed to: ", "topic_" + serverId);
subscriber.on('message', function(channel, packetStr) {
    let packet = JSON.parse(packetStr);
    con.query("SELECT *  FROM conversation_table WHERE cid = ?", packet.convId , function (err, resultSet) {
        if (!err) {
            let userIdList = [];
            for(let i = 0; i < resultSet.length; i++) {
                userIdList.push(resultSet[i].user_id);
            }
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
    });
});
io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("UserIsOnline", ({userId, socketId}) => {
        let userDetails = {"socketId": socket.id, serverId}
        redisClient.set(""+userId, JSON.stringify(userDetails));
        console.log("User connected: ", userDetails);
    });

    socket.on("disconnect", (userId) => {
        redisClient.del(userId)
    });

    socket.on("IncomingMessage", async ({senderId, convId, message}) => {
        con.query("SELECT *  FROM conversation_table WHERE cid = ?", convId , function (err, resultSet) {
            if (!err) {
                let userIdList = [];
                for(let i = 0; i < resultSet.length; i++) {
                    userIdList.push(resultSet[i].user_id);
                }
                redisClient.mget(userIdList, function (err, userDetailsList){
                    let homeUserSocketIdList = [];
                    let otherServerList = new Set();
                    for(let i=0;i<userDetailsList.length;i++){
                        let userDetails = JSON.parse(userDetailsList[i]);
                        if(userDetails.serverId === serverId){
                            if(senderId !== userIdList[i]) {
                                homeUserSocketIdList.push(userDetails.socketId)
                            }
                        }else{
                            otherServerList.add(userDetails.serverId)
                        }
                    }
                    let ts = Math.floor(+new Date() / 1000);
                    let mid = uuidv4()
                    if(homeUserSocketIdList.length>0){
                        io.to(homeUserSocketIdList).emit('SendingMessage', {from: senderId, to: convId, message: message, timestamp: ts, m_id: mid});
                    }
                    // for (let i=0;i< otherServerList.size;i++){
                    for (var otherServer of otherServerList){
                        redisClient.publish("topic_" + otherServer, JSON.stringify({senderId, convId, message}));
                        console.log("published to: ", "topic_" + otherServer)
                    }
                    let body = {
                        m_id: mid,
                        cid: convId,
                        sender_id: senderId,
                        data: message,
                        timestamp: ts,
                        group: false
                    }
                    con.query("INSERT INTO message_table VALUES (?, ?, ?, ?, ?, ?)", [body.m_id, body.cid, body.sender_id, body.data, body. timestamp, body.group], function(err, result) {
                        if(!err) {
                            console.log(result);
                        }
                    });
                })
            }
        });
    });
  });

server.listen(appPort, () => console.log(`Listening on port ${appPort}`));