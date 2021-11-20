import express from "express";
import {ConversationController} from "../controllers/ConversationController";

let router = express.Router();

router.post("/", ConversationController.add);

router.get("/", ConversationController.fetch);

router.get("/:convId", ConversationController.fetchById);

export default router;
