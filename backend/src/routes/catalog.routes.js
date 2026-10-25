import express from "express";
import { getCatalogHubs, getCatalogTrips } from "../controllers/catalog.controller.js";

const router = express.Router();

router.get("/hubs", getCatalogHubs);
router.get("/trips", getCatalogTrips);

export default router;
