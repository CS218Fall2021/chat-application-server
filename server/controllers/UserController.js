const {v4: uuidv4} = require("uuid");
const {initializer} = require("../init");
const moment = require("moment");
let UserController = {}

con = initializer.getSQLConn()

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
    //con.end();
}

UserController.fetchByUserid = (req, res) =>{
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
}

exports.UserController = UserController;