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

  const db = env.retail || env.DB;
  if (!db) {
    return new Response(JSON.stringify({ success: false, error: "Database binding not found" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const url = new URL(request.url);
    
    // 1. GET Request (উন্নত ও নমনীয় ফিল্টারিং যাতে কোনো প্রোডাক্ট মিস না হয়)
    if (request.method === "GET") {
      const productCode = url.searchParams.get("code") || url.searchParams.get("id");
      const sellerId = url.searchParams.get("seller_id");
      const mode = url.searchParams.get("mode");

      let query = "SELECT * FROM products";
      let params = [];
      let conditions = [];

      if (productCode) {
        conditions.push("(product_code = ? OR id = ?)");
        params.push(productCode, productCode);
      }
      if (sellerId) {
        conditions.push("seller_id = ?");
        params.push(sellerId);
      }
      
      // মোড ফিল্টারটি যদি একান্তই দেওয়া হয়, তবে যেন wholesale, both বা ফাঁকা সব রিলায়েবল ডাটা নিয়ে আসে
      if (mode && mode.toLowerCase() !== 'all') {
        const cleanMode = mode.toLowerCase().trim();
        if (cleanMode === 'wholesale') {
          conditions.push("(LOWER(upload_mode) = 'wholesale' OR LOWER(upload_mode) = 'both' OR upload_mode IS NULL OR upload_mode = '')");
        } else if (cleanMode === 'retail') {
          conditions.push("(LOWER(upload_mode) = 'retail' OR LOWER(upload_mode) = 'both' OR upload_mode IS NULL OR upload_mode = '')");
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

      return new Response(JSON.stringify({ success: true, data: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. POST Request
    if (request.method === "POST") {
      const body = await request.json();
      const {
        seller_id, product_code, title, upload_mode, category, price, market_price,
        dropship_base_price, dropship_resell_price, price_sample, price_min_whole,
        price_bulk, stock, moq, image_url, images_json, video_url, youtube_video,
        youtube_live, facebook_live, target_country, discount_rate, allow_custom_note,
        chat_with_seller, description
      } = body;

      const insertQuery = `
        INSERT INTO products (
          seller_id, product_code, title, upload_mode, category, price, market_price, 
          dropship_base_price, dropship_resell_price, price_sample, price_min_whole, 
          price_bulk, stock, moq, image_url, images_json, video_url, youtube_video, 
          youtube_live, facebook_live, target_country, discount_rate, allow_custom_note, 
          chat_with_seller, description, like_count, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))
      `;

      await db.prepare(insertQuery).bind(
        seller_id || null, product_code || null, title || null, upload_mode || "both",
        category || null, price || 0, market_price || 0, dropship_base_price || 0,
        dropship_resell_price || 0, price_sample || 0, price_min_whole || 0, price_bulk || 0,
        stock || 0, moq || 1, image_url || null, 
        images_json ? (typeof images_json === 'string' ? images_json : JSON.stringify(images_json)) : null,
        video_url || null, youtube_video || null, youtube_live || null, facebook_live || null,
        target_country || "bd", discount_rate || "0", allow_custom_note ? 1 : 0,
        chat_with_seller ? 1 : 0, description || null
      ).run();

      return new Response(JSON.stringify({ success: true, message: "Product uploaded successfully!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. PUT Request (Edit)
    if (request.method === "PUT") {
      const body = await request.json();
      const targetId = body.id || url.searchParams.get("id");

      if (!targetId) {
        return new Response(JSON.stringify({ success: false, error: "Product ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const updateQuery = `
        UPDATE products 
        SET title = COALESCE(?, title),
            price = COALESCE(?, price),
            price_min_whole = COALESCE(?, price_min_whole),
            stock = COALESCE(?, stock)
        WHERE id = ? OR product_code = ?
      `;

      await db.prepare(updateQuery).bind(
        body.title || null, body.price || null, body.price_min_whole || null,
        body.stock || null, targetId, targetId
      ).run();

      return new Response(JSON.stringify({ success: true, message: "Product updated successfully!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 4. DELETE Request
    if (request.method === "DELETE") {
      const deleteId = url.searchParams.get("id") || url.pathname.split('/').pop();

      if (!deleteId || deleteId === "products") {
        return new Response(JSON.stringify({ success: false, error: "Valid Product ID is required for deletion" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const deleteQuery = `DELETE FROM products WHERE id = ? OR product_code = ?`;
      await db.prepare(deleteQuery).bind(deleteId, deleteId).run();

      return new Response(JSON.stringify({ success: true, message: "Product deleted successfully!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
