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
            //console.log(result);
            res.json({
                result
            });
        }
        
    });
}

MessageController.fetchByCid = (req, res) =>{
    const cid = req.params.cid;
    console.log(cid);
    con.query("SELECT * FROM message_table WHERE cid = ? order by timestamp ASC", cid, function(err, result) {
        if(err) {
            console.log("err");
            res.json({
                message: "Error"
            });
        }
        else {
            //console.log(result);
            res.json({
                result
            });
        }
        
    });
}

MessageController.fetchByTS = (req, res) => {
    let cid = req.params.cid;
    let from_ts  = req.params.from_ts;
    let to_ts  = req.params.to_ts;
    con.query("SELECT * FROM message_table WHERE timestamp >=  ? AND timestamp <= ? AND cid = ? order by timestamp ASC", [from_ts, to_ts, cid], function(err, result) {
        if(err) {
            console.log("err");
            res.json({
                message: "Error"
            });
        }
        else {
           // console.log(result);
            res.json({
                result
            });
        }
        
    });
}

exports.MessageController = MessageController;