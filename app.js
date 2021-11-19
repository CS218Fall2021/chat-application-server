const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const util = require('util');

const port = process.env.PORT || 4001;
const index = require("./routes/index");
var cors = require('cors');

const redis = require("redis");
// const redisClient = redis.createClient({
//     host: 'instantmessaging.ztvdti.ng.0001.usw1.cache.amazonaws.com',
//     port : 6379,
// });

const redisClient = redis.createClient();

const redisGetAsync = util.promisify(redisClient.get).bind(redisClient);

const app = express();
app.use(index);
app.use(cors());


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

io.on("connection", (socket) => {
    console.log("New client connected");


    /* Make entry in registery on coming online */
    /* Emit event that new user has been addded to the online list */

    socket.on("UserIsOnline", async ({ userId }) => {

        // if(userId === undefined) {
        //     /* Create Random UserId */
        //     userId = `User-${Math.random()*100}`;
        // }

        // redisClient.del("userIDSocketIdMap");
        let currentOnlineUsers = await redisGetAsync('userIDSocketIdMap');
        console.log("currentOnlineUsers", currentOnlineUsers);
        if(!currentOnlineUsers) {
            currentOnlineUsers =  {};
            currentOnlineUsers[userId] = userId;
            // JSON.parse(redisClient.set("userIDSocketIdMap", JSON.stringify));
        } else {
            currentOnlineUsers = JSON.parse(currentOnlineUsers);
        }

        if(!currentOnlineUsers[userId]) {   
            currentOnlineUsers[userId] = userId;            
        }

        await redisClient.set("userIDSocketIdMap", JSON.stringify(currentOnlineUsers));    
        console.log("currentOnlineUsers", currentOnlineUsers);

        io.emit("OnlineUserListUpdate", JSON.stringify(currentOnlineUsers));
        console.log("Listened to UserIsOnline event");

    });

    socket.on("UserIsGoingOffine", async (userId, socketId) => {

        // if(userId === undefined) {
        //     /* Create Random UserId */
        //     userId = `User-${Math.random()*100}`;
        // }

        // const currentOnlineUsers = await redisGetAsync('userIDSocketIdMap');

        // if(!currentOnlineUsers) {
        //     currentOnlineUsers =  JSON.parse(redisClient.set("userIDSocketIdMap", "{}"));
        // }
        // currentOnlineUsers['userId'] = socketId;
        // redisClient.set("userIDSocketIdMap", JSON.stringify(currentOnlineUsers));    
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });

    socket.on("IncomingMessage", ({userId, toSendUserId, message, socketId}) => {
        console.log("message from : ", userId );
        console.log("message : ", message);
        console.log("toSendUserId : ", toSendUserId);
        // io.emit("SendingMessage", {
        //     from: userId,
        //     to: toSendUserId,
        //     message: message
        // });

        socket.broadcast.to(socketId).emit('SendingMessage', {
            from: userId,
            to: toSendUserId,
            message: message
        });
    });
  });

  
  
server.listen(port, () => console.log(`Listening on port ${port}`));