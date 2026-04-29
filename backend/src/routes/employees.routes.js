import express from "express";
import { listEmployees, upsertEmployee, deleteEmployee } from "../controllers/employees.controller.js";
import requireAdminJWT from "../middleware/requireAdminJWT.js";

const router = express.Router();
router.get("/",        requireAdminJWT, listEmployees);
router.post("/upsert", requireAdminJWT, upsertEmployee);
router.delete("/:id",  requireAdminJWT, deleteEmployee);
export default router;
