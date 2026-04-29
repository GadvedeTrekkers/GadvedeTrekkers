import express from "express";
import { listTrekPayments, createTrekPayment, updateTrekPayment, deleteTrekPayment } from "../controllers/trekPayments.controller.js";
import requireAdminJWT from "../middleware/requireAdminJWT.js";

const router = express.Router();
router.get("/",       requireAdminJWT, listTrekPayments);
router.post("/",      requireAdminJWT, createTrekPayment);
router.patch("/:id",  requireAdminJWT, updateTrekPayment);
router.delete("/:id", requireAdminJWT, deleteTrekPayment);
export default router;
