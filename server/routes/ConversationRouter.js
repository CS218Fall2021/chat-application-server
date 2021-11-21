const express = require("express");
const {ConversationController} = require("../controllers/ConversationController");
const bodyParser = require("body-parser");

let router = express.Router();
let pareser = bodyParser.json()

router.post("/", pareser,  ConversationController.add);

router.get("/:userid", pareser, ConversationController.fetchByUserId);

router.get("/conv/:convId", pareser, ConversationController.fetchByConvId);

module.exports = router;
