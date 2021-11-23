const {v4: uuidv4} = require("uuid");
const {initializer} = require("../init");
let ConversationController = {}

redisClient = initializer.getRedisClient()
con = initializer.getSQLConn()

ConversationController.add = (req, res) => {
    console.log("Adding Conversation...");
    let userList = req.body.userList;
    let groupName = req.body.groupName;
    const n = userList.length;
    let convId = uuidv4();
    let values = [];
    for(let i=0;i<n;i++){
        values.push([convId, userList[i]]);
    }
    con.query("INSERT INTO conversation_table (cid, user_id) VALUES ?", [values], function (err, result) {
        if (err) {
            console.log("err");
        } else {
            console.log(result);
            redisClient.set("conv:"+convId, JSON.stringify(userList));
            if(groupName){
                con.query("INSERT INTO group_table (cid, user_id) VALUES ?", [values], function (err, result) {
                    res.json({
                        "success": convId
                    })
                });
            }
            else{
                res.json({
                    "success": convId
                })
            }
        }
    });
}

ConversationController.fetchByUserId = (req, res) => {
    const userid = req.params.userid;
    var body = {
        user_id: userid,
    }

    con.query("SELECT * FROM conversation_table", function(err, result) {
        if(err) {
            console.log("err");
            res.json({
                message: "Error"
            });
        }
        else {
            //console.log(result);
            var userids = [];
            for(var i = 0; i < result.length; i++) {
                if(result[i].user_id == body.user_id) {
                    console.log("result", result)
                    userids.push({cid: result[i].cid, user_id: [], isGroup: false});
                }
            }

            for(var i = 0; i < userids.length; i++) {
                for(var j = 0; j < result.length; j++) {
                    if(userids[i].cid == result[j].cid) {
                        userids[i].user_id.push(result[j].user_id);
                    }
                }
            }
           
            for(var i = 0; i < userids.length; i++) {
                if(userids[i].user_id.length > 2){
                    userids[i].isGroup = true;
                }
            }
            res.json({
                userids
            });
        }

    });
}
ConversationController.fetchByConvId = (req, res) => {
    con.query("SELECT *  FROM conversation_table WHERE cid = ?", req.params.convId , function (err, result) {
        if (err) {
            console.log("err");
        } else {
            //console.log(result);
            res.json({
                result
            })
        }
    });
    console.log(req);
}
exports.ConversationController = ConversationController;