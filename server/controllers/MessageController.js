const {v4: uuidv4} = require("uuid");
const {initializer} = require("../init");
let MessageController = {}

con = initializer.getSQLConn()

MessageController.add = (req, res) => {
}

MessageController.fetchByCid = (req, res) =>{}

MessageController.fetchByTS = (req, res) => {}

exports.MessageController = MessageController;