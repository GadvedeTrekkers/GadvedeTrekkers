import express from "express";
import requireAdminJWT from "../middleware/requireAdminJWT.js";
import {
  createListing,
  deleteAdminListing,
  getAdminListings,
  getPublicListings,
  updateAdminListing,
} from "../controllers/listings.controller.js";

const router = express.Router();

router.get("/public/:type", getPublicListings);
router.post("/:type", createListing);
router.get("/admin/list", requireAdminJWT, getAdminListings);
router.patch("/admin/:id", requireAdminJWT, updateAdminListing);
router.delete("/admin/:id", requireAdminJWT, deleteAdminListing);

export default router;
