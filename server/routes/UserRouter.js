const express = require("express");
const {UserController} = require("../controllers/UserController");

let router = express.Router();
let parser = express.json()

router.get("/", parser,  UserController.getAllUsers);

router.get("/:userid", parser, UserController.fetchByUserid);

router.get("/online/status/:userid", parser, UserController.getUserOnlineStatus)

module.exports = router;