export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
    if (url.pathname.includes("/send-magic-link")) {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { email, mobile_number } = await request.json();
      if (!email) {
        return new Response(JSON.stringify({ error: "Email required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const token = crypto.randomUUID();
      const expiresAt = Date.now() + 180 * 1000;
      const cleanEmail = email.toLowerCase();
      const cleanMobile = mobile_number || "";

      await db.prepare(`
        INSERT INTO sellers (seller_id, email, mobile_number, verification_token, token_expires_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          verification_token = excluded.verification_token,
          token_expires_at = excluded.token_expires_at,
          mobile_number = COALESCE(NULLIF(excluded.mobile_number, ''), sellers.mobile_number)
      `).bind(cleanEmail, cleanEmail, cleanMobile, token, expiresAt).run();

      const magicLink = `https://${url.hostname}/api/seller/verify-magic?token=${token}`;

      return new Response(JSON.stringify({ success: true, magicLink }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (url.pathname.includes("/verify-magic")) {
      const token = url.searchParams.get("token");
      if (!token) return new Response("Invalid Token", { status: 400 });

      const record = await db.prepare(`
        SELECT * FROM sellers WHERE verification_token = ?
      `).bind(token).first();

      if (!record || Date.now() > record.token_expires_at) {
        return new Response("Link expired or invalid!", { status: 410 });
      }

      const now = new Date().toISOString();

      await db.prepare(`
        UPDATE sellers 
        SET is_verified = 1, verified_at = ?, verification_token = NULL, token_expires_at = NULL 
        WHERE verification_token = ?
      `).bind(now, token).run();

      return Response.redirect(`https://${url.hostname}/seller/dashboard.html?verified=true`, 302);
    }

    if (request.method === "POST") {
      const data = await request.json();
      const email = (data.email || data.seller_id || "").toLowerCase();
      const mobileNumber = data.mobile_number || data.phone || "";
      const sellerId = data.seller_id || email;
      const clientIp = request.headers.get("cf-connecting-ip") || "Unknown";
      const country = request.headers.get("cf-ipcountry") || data.country || "Unknown";
      const userAgent = request.headers.get("user-agent") || "Unknown";
      const now = new Date().toISOString();

      if (!email) {
        return new Response(JSON.stringify({ success: false, error: "Email required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await db.prepare(`
        INSERT INTO sellers (
          seller_id, email, mobile_number, brand_name, full_name, business_desc, 
          whatsapp, emergency_phone, country, full_address, doc_type, doc_number, 
          trade_license, logo_url, is_verified, admin_approval_status, last_ip, ip_country, user_agent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'pending', ?, ?, ?, COALESCE((SELECT created_at FROM sellers WHERE email = ?), ?))
        ON CONFLICT(email) DO UPDATE SET
          mobile_number = COALESCE(NULLIF(excluded.mobile_number, ''), sellers.mobile_number),
          brand_name = excluded.brand_name,
          full_name = excluded.full_name,
          business_desc = excluded.business_desc,
          whatsapp = excluded.whatsapp,
          emergency_phone = excluded.emergency_phone,
          country = excluded.country,
          full_address = excluded.full_address,
          doc_type = excluded.doc_type,
          doc_number = excluded.doc_number,
          trade_license = excluded.trade_license,
          logo_url = excluded.logo_url,
          last_ip = excluded.last_ip,
          ip_country = excluded.ip_country,
          user_agent = excluded.user_agent
      `).bind(
        sellerId,
        email,
        mobileNumber,
        data.brand_name || "",
        data.full_name || "",
        data.business_desc || "",
        data.whatsapp || "",
        data.emergency_phone || "",
        data.country || "Bangladesh",
        data.full_address || "",
        data.doc_type || "NID",
        data.doc_number || "",
        data.trade_license || "",
        data.logo_url || "",
        clientIp,
        country,
        userAgent,
        email,
        now
      ).run();

      const sellerRecord = await db.prepare(`SELECT id, seller_id, email FROM sellers WHERE email = ?`).bind(email).first();

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Seller data saved successfully", 
        seller_id: sellerRecord ? sellerRecord.seller_id : null,
        email: email 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (request.method === "GET") {
      const email = url.searchParams.get("email");
      if (!email) {
        return new Response(JSON.stringify({ success: false, error: "Email parameter required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const seller = await db.prepare(`SELECT * FROM sellers WHERE email = ?`).bind(email.toLowerCase()).all();

      return new Response(JSON.stringify({ success: true, data: seller.results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ message: "Seller API Active" }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
```[cite: 1, 4, 19, 20]
