import express from "express";
import requireAdminJWT from "../middleware/requireAdminJWT.js";
import supabaseAdmin from "../config/supabaseAdminClient.js";

const router = express.Router();

/**
 * POST /api/admin-tools/reimport-seed-data
 * Re-import all seed data from frontend to Supabase
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

    // Determine product type from storage key
    const productTypeMap = {
      gt_treks: "trek",
      gt_tours: "tour",
      gt_heritage: "heritage",
      gt_camping: "camping",
      gt_rentals: "rental",
      gt_villas: "villa",
      gt_iv: "iv",
    };

    const productType = productTypeMap[storageKey];
    if (!productType) {
      return res.status(400).json({
        success: false,
        error: `Unknown storage key: ${storageKey}`,
      });
    }

    let imported = 0;
    let updated = 0;
    let failed = 0;
    const errors = [];

    for (const item of seedData) {
      try {
        // Build product row
        const productRow = {
          slug: item.slug || "",
          product_type: productType,
          name: item.name || "",
          subtitle: item.subtitle || "",
          location: item.location || "",
          region: item.region || "mumbai",
          difficulty: item.difficulty || "Medium",
          duration: item.duration || "",
          altitude: item.altitude || "",
          price: item.price || 0,
          original_price: item.originalPrice || item.price || 0,
          rating: item.rating || 0,
          review_count: item.reviews || 0,
          image_url: item.image || "",
          image_gallery: item.imageGallery || "[]",
          about: item.about || "",
          history: item.history || "",
          highlights: item.highlights || "",
          included: item.included || "",
          not_included: item.notIncluded || "",
          things_to_carry: item.thingsToCarry || "",
          itinerary_pdf_url: item.itineraryPdfUrl || "",
          sort_order: item.sortOrder || 999,
          is_active: item.active !== false,
          metadata: JSON.stringify({
            baseVillage: item.baseVillage || "",
            climbTime: item.climbTime || "",
            distance: item.distance || "",
            wildlifeSanctuary: item.wildlifeSanctuary || "",
          }),
        };

        // Upsert to Supabase
        const { data, error } = await supabaseAdmin
          .from("products")
          .upsert(productRow, { onConflict: "slug" })
          .select("id")
          .single();

        if (error) {
          failed++;
          errors.push(`${item.name}: ${error.message}`);
          console.error(`[Admin Tools] Failed to import ${item.name}:`, error.message);
        } else {
          if (data) {
            imported++;
            console.log(`[Admin Tools] ✅ Imported: ${item.name}`);
          } else {
            updated++;
            console.log(`[Admin Tools] ✅ Updated: ${item.name}`);
          }
        }
      } catch (err) {
        failed++;
        errors.push(`${item.name}: ${err.message}`);
        console.error(`[Admin Tools] Error importing ${item.name}:`, err);
      }
    }

    console.log(`[Admin Tools] Import complete: ${imported} imported, ${updated} updated, ${failed} failed`);

    return res.json({
      success: true,
      data: {
        total: seedData.length,
        imported,
        updated,
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
