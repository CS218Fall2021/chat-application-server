const {v4: uuidv4} = require("uuid");
const {initializer} = require("../init");
const moment = require("moment");
let MessageController = {}

con = initializer.getSQLConn()

MessageController.add = (req, res) => {
    var body = {
        m_id: uuidv4(),
        cid: req.body.cid,
        sender_id: req.body.sender_id,
        data: req.body.data,
        timestamp: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
        group: req.body.group
    } 
    
    con.query("INSERT INTO message_table VALUES (?, ?, ?, ?, ?, ?)", [body.m_id, body.cid, body.sender_id, body.data, body. timestamp, body.group], function(err, result) {
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

MessageController.fetchByCid = (req, res) =>{
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
}

MessageController.fetchByTS = (req, res) => {
    var mom = moment();
    const ts = mom.subtract(10, "days").format('YYYY-MM-DD HH:mm:ss');
    var cid = req.params.cid;
//timestamp >= ? AND
    con.query("SELECT * FROM message_table WHERE timestamp >= ? AND cid = ?", [ts, cid], function(err, result) {
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

exports.MessageController = MessageController;