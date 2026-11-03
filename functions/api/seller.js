export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // ==========================================
      // ১. সেলার ম্যাজিক লিংক জেনারেট করার এন্ডপয়েন্ট
      // ==========================================
      if (url.pathname === "/api/seller/send-magic-link" && request.method === "POST") {
        const { email } = await request.json();
        if (!email) {
          return new Response(JSON.stringify({ error: "Email required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const token = crypto.randomUUID();
        const expiresAt = Date.now() + 180 * 1000; // ৩ মিনিট মেয়াদ

        await env.ror.prepare(`
          INSERT INTO verification_tokens (token, email, expires_at)
          VALUES (?, ?, ?)
        `).bind(token, email.toLowerCase(), expiresAt).run();

        const magicLink = `https://${url.hostname}/api/seller/verify-magic?token=${token}`;

        return new Response(JSON.stringify({ success: true, magicLink }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // ==========================================
      // ২. সেলার ভেরিফিকেশন এবং যোগদানের তারিখসহ সিকিউরিটি ইনফো সেভ
      // ==========================================
      if (url.pathname === "/api/seller/verify-magic" && request.method === "GET") {
        const token = url.searchParams.get("token");
        if (!token) return new Response("Invalid Token", { status: 400 });

        const record = await env.ror.prepare(`
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

        // সেলার টেবিলে ডাটা ইনসার্ট (যদি নতুন হয় created_at বসবে, পুরানো হলে আপডেট হবে না)
        await env.ror.prepare(`
          INSERT INTO sellers (email, is_verified, last_ip, ip_country, user_agent, verified_at, created_at)
          VALUES (?, 1, ?, ?, ?, ?, ?)
          ON CONFLICT(email) DO UPDATE SET
            is_verified = 1,
            last_ip = excluded.last_ip,
            ip_country = excluded.ip_country,
            user_agent = excluded.user_agent,
            verified_at = excluded.verified_at
        `).bind(email, clientIp, country, userAgent, now, now).run();

        // ব্যবহৃত টোকেন মুছে ফেলা
        await env.ror.prepare(`DELETE FROM verification_tokens WHERE token = ?`).bind(token).run();

        return Response.redirect(`https://rorraxy.com/seller/dashboard.html?verified=true`, 302);
      }

      // ==========================================
      // ৩. সেলার ইনফো (প্রোফাইল) সেভ এবং ফেচ করার এন্ডপয়েন্ট
      // ==========================================
      if (url.pathname === "/api/seller" && request.method === "POST") {
        const data = await request.json();
        const email = (data.email || data.seller_id || "").toLowerCase();
        const now = new Date().toISOString();

        if (!email) {
          return new Response(JSON.stringify({ success: false, error: "Email required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        await env.ror.prepare(`
          INSERT INTO sellers (
            email, brand_name, full_name, business_desc, whatsapp, 
            emergency_phone, country, full_address, doc_type, doc_number, trade_license, logo_url, is_verified, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
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
            logo_url = excluded.logo_url
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
          data.default_payout_details || data.trade_license || "",
          data.logo_url || "",
          now
        ).run();

        return new Response(JSON.stringify({ success: true, message: "Seller profile updated successfully" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (url.pathname === "/api/seller" && request.method === "GET") {
        const email = url.searchParams.get("email");
        if (!email) {
          return new Response(JSON.stringify({ success: false, error: "Email parameter required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        const seller = await env.ror.prepare(`SELECT * FROM sellers WHERE email = ?`).bind(email.toLowerCase()).all();

        return new Response(JSON.stringify({ success: true, data: seller.results }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response("rorraxy Seller API is running perfectly!", { status: 200, headers: corsHeaders });

    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
};
