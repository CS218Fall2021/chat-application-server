const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const util = require('util');
const { v4: uuidv4 } = require('uuid');

const port = process.env.PORT || 4001;
const index = require("./routes/index");
const cors = require('cors');
const {initializer} = require("./init");
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

io.on("connection", (socket) => {
    console.log("New client connected");
    socket.on("UserIsOnline", ({ userId, socketId }) => {
        let userDetails = {socketId, serverId};
        redisClient.set(userId, JSON.stringify(userDetails));
        console.log("User connected");
    });

    socket.on("UserIsGoingOffine", (userId) => {
         redisClient.del(userId)
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