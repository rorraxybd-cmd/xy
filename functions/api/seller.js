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

  // অটো-ডিটেক্ট D1 ডাটাবেজ বাইন্ডিং (retail অথবা DB)
  const db = env.retail || env.DB;
  if (!db) {
    return new Response(JSON.stringify({ success: false, error: "Database binding not found in environment (env.retail or env.DB)" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    // ১. ম্যাজিক লিংক জেনারেট রিকোয়েস্ট
    if (url.pathname.includes("/send-magic-link")) {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { email } = await request.json();
      if (!email) {
        return new Response(JSON.stringify({ error: "Email required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const token = crypto.randomUUID();
      const expiresAt = Date.now() + 180 * 1000;

      await db.prepare(`
        INSERT INTO verification_tokens (token, email, expires_at)
        VALUES (?, ?, ?)
      `).bind(token, email.toLowerCase(), expiresAt).run();

      const magicLink = `https://${url.hostname}/api/seller/verify-magic?token=${token}`;

      return new Response(JSON.stringify({ success: true, magicLink }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ২. ম্যাজিক লিংক ভেরিফিকেশন ও সিকিউরিটি লগ
    if (url.pathname.includes("/verify-magic")) {
      const token = url.searchParams.get("token");
      if (!token) return new Response("Invalid Token", { status: 400 });

      const record = await db.prepare(`
        SELECT * FROM verification_tokens WHERE token = ?
      `).bind(token).first();

      if (!record || Date.now() > record.expires_at) {
        return new Response("Link expired or invalid!", { status: 410 });
      }

      const email = record.email;
      const clientIp = request.headers.get("cf-connecting-ip") || "Unknown";
      const country = request.headers.get("cf-ipcountry") || "Unknown";
      const userAgent = request.headers.get("user-agent") || "Unknown";
      const now = new Date().toISOString();

      await db.prepare(`
        INSERT INTO sellers (email, is_verified, last_ip, ip_country, user_agent, verified_at, created_at)
        VALUES (?, 1, ?, ?, ?, ?, COALESCE((SELECT created_at FROM sellers WHERE email = ?), ?))
        ON CONFLICT(email) DO UPDATE SET
          is_verified = 1,
          last_ip = excluded.last_ip,
          ip_country = excluded.ip_country,
          user_agent = excluded.user_agent,
          verified_at = excluded.verified_at
      `).bind(email, clientIp, country, userAgent, now, email, now).run();

      await db.prepare(`DELETE FROM verification_tokens WHERE token = ?`).bind(token).run();

      // ভেরিফিকেশনের পর সরাসরি ড্যাশবোর্ডে রিডাইরেক্ট
      return Response.redirect(`https://${url.hostname}/seller/dashboard.html?verified=true`, 302);
    }

    // ৩. সেলার প্রোফাইল ডাটা সেভ (POST) - সাথে সেলারের মূল ID রিটার্ন করার ব্যবস্থা
    if (request.method === "POST") {
      const data = await request.json();
      const email = (data.email || data.seller_id || "").toLowerCase();
      const clientIp = request.headers.get("cf-connecting-ip") || "Unknown";
      const country = request.headers.get("cf-ipcountry") || data.country || "Unknown";
      const userAgent = request.headers.get("user-agent") || "Unknown";
      const now = new Date().toISOString();

      if (!email) {
        return new Response(JSON.stringify({ success: false, error: "Email required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await db.prepare(`
        INSERT INTO sellers (
          email, brand_name, full_name, business_desc, whatsapp, 
          emergency_phone, country, full_address, doc_type, doc_number, trade_license, logo_url, is_verified, last_ip, ip_country, user_agent, verified_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, COALESCE((SELECT created_at FROM sellers WHERE email = ?), ?))
        ON CONFLICT(email) DO UPDATE SET
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
          user_agent = excluded.user_agent,
          verified_at = COALESCE(sellers.verified_at, excluded.verified_at)
      `).bind(
        email,
        data.brand_name || "",
        data.full_name || "",
        data.business_desc || "",
        data.whatsapp || "",
        data.emergency_phone || "",
        data.country || "Bangladesh",
        data.full_address || "",
        data.doc_type || "NID",
        data.doc_number || "",
        data.trade_license || data.default_payout_details || "",
        data.logo_url || "",
        clientIp,
        country,
        userAgent,
        now,
        email,
        now
      ).run();

      // সেভ হওয়ার পর ওই সেলারের ইউনিক ID সহ রেকর্ড ফেচ করে নেওয়া
      const sellerRecord = await db.prepare(`SELECT id, email FROM sellers WHERE email = ?`).bind(email).first();

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Seller profile and security logs saved successfully to D1", 
        seller_id: sellerRecord ? sellerRecord.id : null,
        email: email 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ৪. সেলার প্রোফাইল ডাটা ফেচ (GET)
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

    return new Response(JSON.stringify({ message: "Seller Pages Function Active" }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
