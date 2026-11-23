export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const db = env.retail || env.DB;
  if (!db) {
    return json({ success: false, error: "Database binding not found" }, 500);
  }

  try {
    const url = new URL(request.url);

    // ========== GET ==========
    if (request.method === "GET") {
      const productCode = url.searchParams.get("code") || url.searchParams.get("id");
      const sku = url.searchParams.get("sku");
      const sellerId = url.searchParams.get("seller_id");
      const mode = url.searchParams.get("mode");

      let query = "SELECT * FROM products";
      const params = [];
      const conditions = [];

      if (productCode) {
        conditions.push(
          "(product_code = ? OR id = ? OR UPPER(TRIM(sku)) = UPPER(TRIM(?)))"
        );
        params.push(productCode.trim(), productCode.trim(), productCode.trim());
      }

      if (sku) {
        conditions.push("UPPER(TRIM(sku)) = UPPER(TRIM(?))");
        params.push(sku.trim());
      }

      if (sellerId) {
        conditions.push("seller_id = ?");
        params.push(sellerId.trim());
      }

      if (mode && mode.toLowerCase() !== "all") {
        const cleanMode = mode.toLowerCase().trim();
        if (cleanMode === "wholesale" || cleanMode === "retail") {
          conditions.push(
            "(LOWER(upload_mode) = ? OR LOWER(upload_mode) = 'both' OR upload_mode IS NULL OR upload_mode = '')"
          );
          params.push(cleanMode);
        } else {
          conditions.push("LOWER(upload_mode) = ?");
          params.push(cleanMode);
        }
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY created_at DESC";
      const { results } = await db.prepare(query).bind(...params).all();
      return json({ success: true, data: results || [] });
    }

    // ========== POST (Create) ==========
    if (request.method === "POST") {
      const body = await request.json();

      if (!body.sku || String(body.sku).trim().length < 3) {
        return json({ success: false, error: "SKU is required (min 3 chars)." }, 400);
      }
      if (!body.title) {
        return json({ success: false, error: "Title is required." }, 400);
      }

      const cleanSku = String(body.sku).trim().toUpperCase();

      // Duplicate SKU check — friendly error
      const existing = await db
        .prepare("SELECT id FROM products WHERE UPPER(TRIM(sku)) = ?")
        .bind(cleanSku)
        .first();
      if (existing) {
        return json(
          { success: false, error: "SKU already exists. Please use a unique SKU." },
          409
        );
      }

      const insertQuery = `
        INSERT INTO products (
          seller_id, product_code, sku, title, upload_mode, category, price, market_price,
          dropship_base_price, dropship_resell_price, price_sample, price_min_whole,
          price_bulk, stock, moq, image_url, images_json, video_url, youtube_video,
          youtube_live, facebook_live, target_country, discount_rate, allow_custom_note,
          chat_with_seller, description, like_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
      `;

      const result = await db
        .prepare(insertQuery)
        .bind(
          body.seller_id || null,
          body.product_code || cleanSku,
          cleanSku,
          body.title || null,
          body.upload_mode || "both",
          body.category || null,
          body.price ?? 0,
          body.market_price ?? 0,
          body.dropship_base_price ?? 0,
          body.dropship_resell_price ?? 0,
          body.price_sample ?? 0,
          body.price_min_whole ?? 0,
          body.price_bulk ?? 0,
          body.stock ?? 0,
          body.moq ?? 1,
          body.image_url || null,
          body.images_json
            ? typeof body.images_json === "string"
              ? body.images_json
              : JSON.stringify(body.images_json)
            : null,
          body.video_url || null,
          body.youtube_video || null,
          body.youtube_live || null,
          body.facebook_live || null,
          body.target_country || "bd",
          body.discount_rate ?? "0",
          body.allow_custom_note ? 1 : 0,
          body.chat_with_seller ? 1 : 0,
          body.description || null
        )
        .run();

      return json({
        success: true,
        message: "Product uploaded successfully!",
        id: result.meta?.last_row_id ?? null,
        sku: cleanSku,
      });
    }

    // ========== PUT (Update) ==========
    if (request.method === "PUT") {
      const body = await request.json();
      const targetId =
        body.id || url.searchParams.get("id") || body.product_code || body.sku;

      if (!targetId) {
        return json({ success: false, error: "Product ID / SKU is required." }, 400);
      }

      // Find the record first (id / product_code / sku — যেকোনোটা দিয়ে)
      const target = await db
        .prepare(
          "SELECT id, sku FROM products WHERE id = ? OR product_code = ? OR UPPER(TRIM(sku)) = UPPER(TRIM(?)) LIMIT 1"
        )
        .bind(targetId, targetId, targetId)
        .first();

      if (!target) {
        return json({ success: false, error: "Product not found." }, 404);
      }

      // SKU uniqueness check (excluding self)
      if (body.sku) {
        const newSku = String(body.sku).trim().toUpperCase();
        const dup = await db
          .prepare("SELECT id FROM products WHERE UPPER(TRIM(sku)) = ? AND id != ?")
          .bind(newSku, target.id)
          .first();
        if (dup) {
          return json({ success: false, error: "SKU already exists." }, 409);
        }
      }

      const allowedFields = [
        "sku", "title", "price", "market_price", "price_sample", "price_min_whole",
        "price_bulk", "stock", "moq", "upload_mode", "category", "image_url",
        "images_json", "video_url", "youtube_video", "youtube_live", "facebook_live",
        "target_country", "discount_rate", "allow_custom_note", "chat_with_seller",
        "description",
      ];

      const setParts = [];
      const values = [];

      for (const field of allowedFields) {
        if (body[field] === undefined) continue;
        let val = body[field];

        if (field === "sku" && val !== null) val = String(val).trim().toUpperCase();
        if (field === "images_json" && val !== null && typeof val !== "string") {
          val = JSON.stringify(val);
        }
        if (field === "allow_custom_note" || field === "chat_with_seller") {
          val = val ? 1 : 0;
        }

        setParts.push(`${field} = ?`);
        values.push(val);
      }

      if (setParts.length === 0) {
        return json({ success: false, error: "No fields to update." }, 400);
      }

      values.push(target.id);

      const result = await db
        .prepare(`UPDATE products SET ${setParts.join(", ")} WHERE id = ?`)
        .bind(...values)
        .run();

      return json({
        success: true,
        message: "Product updated successfully!",
        changes: result.meta?.changes ?? 0,
      });
    }

    // ========== DELETE ==========
    if (request.method === "DELETE") {
      const deleteId =
        url.searchParams.get("id") ||
        url.searchParams.get("sku") ||
        url.pathname.split("/").pop();

      if (!deleteId || deleteId === "products") {
        return json(
          { success: false, error: "Valid Product ID / SKU is required." },
          400
        );
      }

      const result = await db
        .prepare(
          "DELETE FROM products WHERE id = ? OR product_code = ? OR UPPER(TRIM(sku)) = UPPER(TRIM(?))"
        )
        .bind(deleteId, deleteId, deleteId)
        .run();

      return json({
        success: true,
        message: "Product deleted successfully!",
        changes: result.meta?.changes ?? 0,
      });
    }

    return json({ success: false, error: "Method not allowed." }, 405);
  } catch (err) {
    return json({ success: false, error: err.message }, 500);
  }
}
