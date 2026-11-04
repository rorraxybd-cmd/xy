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

  // অটো-ডিটেক্ট D1 ডাটাবেজ বাইন্ডিং (retail অথবা DB)
  const db = env.retail || env.DB;
  if (!db) {
    return new Response(JSON.stringify({ success: false, error: "Database binding not found in environment (env.retail or env.DB)" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const url = new URL(request.url);
    
    // ১. GET রিকোয়েস্ট: প্রোডাক্ট বা মোড অনুযায়ী ডাটা ফেচ করা
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

      if (mode) {
        const lowerMode = mode.toLowerCase().trim();
        if (lowerMode === 'retail') {
          conditions.push("(LOWER(upload_mode) = 'retail' OR LOWER(upload_mode) = 'both' OR LOWER(upload_mode) = 'all' OR upload_mode IS NULL OR upload_mode = '')");
        } else if (lowerMode === 'dropshipping' || lowerMode === 'dropship') {
          conditions.push("(LOWER(upload_mode) = 'dropshipping' OR LOWER(upload_mode) = 'dropship' OR LOWER(upload_mode) = 'all' OR LOWER(upload_mode) = 'both' OR upload_mode IS NULL OR upload_mode = '')");
        } else if (lowerMode === 'wholesale') {
          conditions.push("(LOWER(upload_mode) = 'wholesale' OR LOWER(upload_mode) = 'both' OR LOWER(upload_mode) = 'all' OR upload_mode IS NULL OR upload_mode = '')");
        } else {
          conditions.push("LOWER(upload_mode) = ?");
          params.push(lowerMode);
        }
      }

      if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
      }

      query += " ORDER BY created_at DESC";

      const stmt = db.prepare(query).bind(...params);
      const { results } = await stmt.all();

      return new Response(JSON.stringify({ success: true, data: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ২. POST রিকোয়েস্ট: নতুন প্রোডাক্ট ইনপুট দেওয়া
    if (request.method === "POST") {
      const body = await request.json();
      
      const {
        seller_id,
        product_code,
        title,
        upload_mode,
        category,
        price,
        market_price,
        dropship_base_price,
        dropship_resell_price,
        price_sample,
        price_min_whole,
        price_bulk,
        stock,
        moq,
        image_url,
        images_json,
        video_url,
        youtube_video,
        youtube_live,
        facebook_live,
        target_country,
        discount_rate,
        allow_custom_note,
        chat_with_seller,
        description
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
        seller_id || null,
        product_code || null,
        title || null,
        upload_mode || "both", // 'both' সেভ হবে যাতে রিটেইল ও হোলসেল দুটিতেই দেখায়
        category || null,
        price || 0,
        market_price || 0,
        dropship_base_price || 0,
        dropship_resell_price || 0,
        price_sample || 0,
        price_min_whole || 0,
        price_bulk || 0,
        stock || 0,
        moq || 1,
        image_url || null,
        images_json ? (typeof images_json === 'string' ? images_json : JSON.stringify(images_json)) : null,
        video_url || null,
        youtube_video || null,
        youtube_live || null,
        facebook_live || null,
        target_country || "bd",
        discount_rate || "0",
        allow_custom_note ? 1 : 0,
        chat_with_seller ? 1 : 0,
        description || null
      ).run();

      return new Response(JSON.stringify({ success: true, message: "Product uploaded successfully!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ৩. PUT রিকোয়েস্ট: প্রোডাক্ট আপডেট (এডিট) বা লাইক বাড়ানো
    if (request.method === "PUT") {
      const body = await request.json();
      const targetId = url.pathname.split('/').pop() || body.id || body.product_code;

      if (!targetId) {
        return new Response(JSON.stringify({ success: false, error: "Product ID or Code is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // যদি লাইক আপডেট রিকোয়েস্ট হয়
      if (body.action === 'like') {
        const updateLike = `UPDATE products SET like_count = COALESCE(like_count, 0) + 1 WHERE id = ? OR product_code = ?`;
        await db.prepare(updateLike).bind(targetId, targetId).run();
        return new Response(JSON.stringify({ success: true, message: "Like count updated!" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // সাধারণ অ্যাডমিন এডিট (Title, Price, Wholesale Price, Stock)
      const updateQuery = `
        UPDATE products 
        SET title = COALESCE(?, title),
            price = COALESCE(?, price),
            price_min_whole = COALESCE(?, price_min_whole),
            stock = COALESCE(?, stock)
        WHERE id = ? OR product_code = ?
      `;

      await db.prepare(updateQuery).bind(
        body.title || null,
        body.price || null,
        body.price_min_whole || null,
        body.stock || null,
        targetId,
        targetId
      ).run();

      return new Response(JSON.stringify({ success: true, message: "Product updated successfully!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ৪. DELETE রিকোয়েস্ট: প্রোডাক্ট মুছে ফেলা
    if (request.method === "DELETE") {
      const deleteId = url.pathname.split('/').pop() || url.searchParams.get("id");

      if (!deleteId) {
        return new Response(JSON.stringify({ success: false, error: "Product ID is required for deletion" }), {
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
