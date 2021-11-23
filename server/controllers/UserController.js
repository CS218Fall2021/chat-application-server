const {v4: uuidv4} = require("uuid");
const {initializer} = require("../init");
const moment = require("moment");
let UserController = {}

con = initializer.getSQLConn()
const redisClient = initializer.getRedisClient();

UserController.getAllUsers = (req, res) => {
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
}

UserController.fetchByUserid = (req, res) =>{
    const userid = req.params.userid;
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
}

UserController.getUserOnlineStatus = (req, res) => {
    const userid = req.params.userid;
   
    redisClient.get(`${userid}`, (err, user) => {
        console.log("user", user, typeof user);
        if(user) {
            res.json({isOnline : true});
        } else {
            res.json({isOnline : false});
        }
    })
}

exports.UserController = UserController;