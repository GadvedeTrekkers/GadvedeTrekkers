import express from "express";
import requireAdminJWT from "../middleware/requireAdminJWT.js";
import { listCustomers, getCustomerById, upsertCustomer } from "../controllers/customers.controller.js";

const router = express.Router();

router.get("/",    requireAdminJWT, listCustomers);
router.get("/:id", requireAdminJWT, getCustomerById);
router.post("/upsert", requireAdminJWT, upsertCustomer); // staff only; public flows create customers server-side

export default router;
