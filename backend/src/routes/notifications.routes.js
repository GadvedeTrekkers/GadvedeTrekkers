import express from "express";
import { notifyTrekAssigned, getLeaderTreks } from "../controllers/notifications.controller.js";
import requireAdminJWT from "../middleware/requireAdminJWT.js";

const router = express.Router();

// POST /api/notify/trek-assigned — called by admin when assigning a leader
router.post("/trek-assigned", requireAdminJWT, notifyTrekAssigned);

// GET /api/notify/leader-treks/:leaderName — called by employee portal to get assigned treks
router.get("/leader-treks/:leaderName", getLeaderTreks);

export default router;
