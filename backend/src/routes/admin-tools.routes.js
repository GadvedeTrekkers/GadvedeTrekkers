import express from "express";
import requireAdminJWT from "../middleware/requireAdminJWT.js";
import supabaseAdmin from "../config/supabaseAdminClient.js";
import { productRowFromItem } from "../utils/productMapper.js";

const router = express.Router();

/**
 * POST /api/admin-tools/reimport-seed-data
 * Re-import all seed data from frontend to Supabase.
 * Uses the same productRowFromItem mapper as the main upsert endpoint
 * so column names are always correct.
 * Body: { storageKey: string, seedData: array }
 */
router.post("/reimport-seed-data", requireAdminJWT, async (req, res) => {
  try {
    const { storageKey, seedData } = req.body;

    if (!storageKey || !Array.isArray(seedData)) {
      return res.status(400).json({
        success: false,
        error: "Invalid request. Provide storageKey and seedData array.",
      });
    }

    console.log(`[Admin Tools] Re-importing ${seedData.length} items for ${storageKey}`);

    let imported = 0;
    let failed = 0;
    const errors = [];

    for (const item of seedData) {
      try {
        const productRow = productRowFromItem(storageKey, item);

        if (!productRow) {
          failed++;
          errors.push(`${item.name || "unknown"}: Invalid storageKey ${storageKey}`);
          continue;
        }

        const { error } = await supabaseAdmin
          .from("products")
          .upsert(productRow, { onConflict: "slug" });

        if (error) {
          failed++;
          errors.push(`${item.name}: ${error.message}`);
          console.error(`[Admin Tools] Failed: ${item.name} —`, error.message);
        } else {
          imported++;
          console.log(`[Admin Tools] ✅ ${item.name}`);
        }
      } catch (err) {
        failed++;
        errors.push(`${item.name}: ${err.message}`);
        console.error(`[Admin Tools] Error: ${item.name}`, err);
      }
    }

    console.log(`[Admin Tools] Done: ${imported} imported, ${failed} failed`);

    return res.json({
      success: true,
      data: {
        total: seedData.length,
        imported,
        failed,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    console.error("[Admin Tools] Reimport error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

export default router;
