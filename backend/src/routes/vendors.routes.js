import express from "express";
import { listVendors, upsertVendor, deleteVendor } from "../controllers/vendors.controller.js";
import requireAdminJWT from "../middleware/requireAdminJWT.js";

const router = express.Router();
router.get("/",        requireAdminJWT, listVendors);
router.post("/upsert", requireAdminJWT, upsertVendor);
router.delete("/:id",  requireAdminJWT, deleteVendor);
export default router;
