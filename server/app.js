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

//Database Connection
const mysql = require("mysql");
const db = require("./config/database");

const redisGetAsync = util.promisify(redisClient.get).bind(redisClient);

const app = express();
app.use(index);
app.use(cors());
const serverId = uuidv4();

//Database
app.use(express.json());
app.use(function(req, res, next) {
    res.setHeader("Content-Type", "application/json");
    next();
});

//Database Connection
const con = mysql.createConnection({
    host: db.host,
    user: db.username,
    password: db.password,
    port: "3306",
    database: db.database
});
con.connect(function(err) {
    console.log("Connected!");
});

// API's
// /user to fetch all users => get                                    DONE
// /user/{user_id} to fetch user with id = user_id => get             DONE
// /message/{c_id} => get                                             DONE
// /conversation => post                                              DONE
// Send messages through socket

app.get('/', function(req,res) {
    res.json({'message': 'ok'});
});

app.get('/user', function(req, res) {
    con.query('SELECT * FROM user_table', function(err, result) {
        if(err) {
            console.log("err");
            res.json({
                message: "Error"
            });
        }
        else {
            console.log(result);
            res.json({
                result
            });
        }
        
    });
    //con.end();
});
app.get('/message/:cid', function(req, res) {
    const cid = req.params.cid;
    console.log(cid);
    con.query("SELECT * FROM message_table WHERE cid = ?", cid, function(err, result) {
        if(err) {
            console.log("err");
            res.json({
                message: "Error"
            });
        }
        else {
            console.log(result);
            res.json({
                result
            });
        }
        
    });
    //con.end();
});
app.get('/user/:userid', function(req, res) {
    const userid = req.params.userid;
    console.log(userid);
    con.query("SELECT * FROM user_table WHERE user_id = ?", userid, function(err, result) {
        if(err) {
            console.log("err");
            res.json({
                message: "Error"
            });
        }
        else {
            console.log(result);
            res.json({
                result
            });
        }
        
    });
    //con.end();
});

app.post('/conversation', function(req, res) {
    var body = {
        cid: req.body.cid,
        user_id: req.body.user_id
    }
    console.log(body);
    con.query("INSERT INTO conversation_table VALUES (?, ?)", [body.cid, body.user_id], function(err, result) {
        if(err) {
            console.log("err");
            res.json({
                message: "Error"
            });
        }
        else {
            console.log(result);
            res.json({
                body
            });
        }
        
    });
    //con.end();
});




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