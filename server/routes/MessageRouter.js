const express = require("express");
const {MessageController} = require("../controllers/MessageController");

let router = express.Router();
let parser = express.json()

router.post("/", parser,  MessageController.add);

router.get("/:cid", parser, MessageController.fetchByCid);

router.get("/:cid/ts", parser, MessageController.fetchByTS);

module.exports = router;
