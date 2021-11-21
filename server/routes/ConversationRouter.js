const express = require("express");
const {ConversationController} = require("../controllers/ConversationController");

let router = express.Router();
let parser = express.json()

router.post("/", parser,  ConversationController.add);

router.get("/:userid", parser, ConversationController.fetchByUserId);

router.get("/conv/:convId", parser, ConversationController.fetchByConvId);

module.exports = router;
