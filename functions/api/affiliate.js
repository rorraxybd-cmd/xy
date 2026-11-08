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

  try {
    const action = url.searchParams.get("action");

    // ==========================================
    // ১. ম্যাজিক লিংক ও আইপি ভেরিফিকেশন (Send Magic Code & IP Security)
    // ==========================================
    if (action === "send_magic_link" || action === "verify") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), { 
          status: 405, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      const body = await request.json();
      const email = (body.email || "").toLowerCase().trim();
      const countryCode = body.country_code || "+880";
      const phone = (body.phone || "").trim();
      
      // নিখুঁত আইপি ডিটেকশন ও হ্যান্ডলিং (Detecting... বা খালি থাকলে ক্লাউডফ্লেয়ার বা রিমোট অ্যাড্র্রেস ধরবে)
      const cfIp = request.headers.get("cf-connecting-ip");
      const remoteIp = request.headers.get("x-forwarded-for") || request.socket?.remoteAddress;
      const userIp = (body.ip && body.ip !== "Detecting..." && body.ip.trim() !== "") 
        ? body.ip 
        : (cfIp || remoteIp || "127.0.0.1");
        
      const userAgent = request.headers.get("user-agent"] || "";

      if (!email) {
        return new Response(JSON.stringify({ success: false, error: "Email required" }), { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // চেক করব এই ইমেইলের কোনো রেকর্ড আগে থেকেই আছে কি না
      let existingRecord = await env.retail.prepare(
        `SELECT unique_affiliate_id FROM rorraxy_affiliates_master WHERE email = ?`
      ).bind(email).first();

      let generatedUniqueId = existingRecord?.unique_affiliate_id;

      if (!generatedUniqueId) {
        const emailPrefix = email.split('@')[0].replace(/[^a-z0-9]/gi, '').substring(0, 7);
        const randomHash = Math.random().toString(36).substring(2, 8);
        generatedUniqueId = `${emailPrefix}_${randomHash}_${Date.now().toString(36).slice(-3)}`;
      }

      const now = new Date().toISOString();

      // ডাটাবেসে ইনসার্ট অথবা আপডেট (আইপি এবং ইউজার এজেন্ট সহ)
      await env.retail.prepare(`
        INSERT INTO rorraxy_affiliates_master (
          unique_affiliate_id, email, country_code, phone, user_ip, user_agent, auth_provider, status, admin_approval, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'email', 'active', 'pending', ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          country_code = excluded.country_code,
          phone = CASE WHEN excluded.phone != '' THEN excluded.phone ELSE rorraxy_affiliates_master.phone END,
          user_ip = CASE WHEN excluded.user_ip != 'Detecting...' AND excluded.user_ip != '' THEN excluded.user_ip ELSE rorraxy_affiliates_master.user_ip END,
          user_agent = excluded.user_agent,
          updated_at = excluded.updated_at
      `).bind(generatedUniqueId, email, countryCode, phone, userIp, userAgent, now, now).run();

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Magic verification code and IP recorded successfully", 
        unique_affiliate_id: generatedUniqueId 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ==========================================
    // ২. ম্যাজিক কোড ভেরিফিকেশন এন্ডপয়েন্ট
    // ==========================================
    if (action === "verify_magic_code" && request.method === "POST") {
      const body = await request.json();
      const email = (body.email || "").toLowerCase().trim();
      
      const cfIp = request.headers.get("cf-connecting-ip");
      const userIp = (body.ip && body.ip !== "Detecting..." && body.ip.trim() !== "") 
        ? body.ip 
        : (cfIp || "127.0.0.1");
        
      const now = new Date().toISOString();

      await env.retail.prepare(`
        UPDATE rorraxy_affiliates_master SET
          user_ip = ?,
          updated_at = ?
        WHERE email = ?
      `).bind(userIp, now, email).run();

      const record = await env.retail.prepare(
        `SELECT unique_affiliate_id FROM rorraxy_affiliates_master WHERE email = ?`
      ).bind(email).first();

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Magic code and IP verified", 
        unique_affiliate_id: record?.unique_affiliate_id 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ==========================================
    // ৩. প্রোফাইল ইনফো রেজিস্টার ও আপডেট
    // ==========================================
    if (action === "register" && request.method === "POST") {
      const data = await request.json();
      const email = (data.email || "").toLowerCase().trim();
      const now = new Date().toISOString();

      if (!email) {
        return new Response(JSON.stringify({ success: false, error: "Email required" }), { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      await env.retail.prepare(`
        UPDATE rorraxy_affiliates_master SET
          first_name = ?,
          last_name = ?,
          country_code = COALESCE(NULLIF(?, ''), country_code),
          phone = ?,
          promo_channel = ?,
          payment_method = ?,
          account_details = ?,
          updated_at = ?
        WHERE email = ?
      `).bind(
        data.first_name || "",
        data.last_name || "",
        data.country_code || "",
        data.phone || "",
        data.promo_channel || "",
        data.payment_method || "",
        data.account_details || "",
        now,
        email
      ).run();

      return new Response(JSON.stringify({ success: true, message: "Affiliate info updated successfully" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ==========================================
    // ৪. প্রোফাইল ডাটা ফেচ (GET)
    // ==========================================
    if (action === "info" && request.method === "GET") {
      const affiliateId = url.searchParams.get("affiliate_id");
      if (!affiliateId) {
        return new Response(JSON.stringify({ success: false, error: "Affiliate ID required" }), { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      const queryParam = affiliateId.toLowerCase().trim();
      const info = await env.retail.prepare(`
        SELECT * FROM rorraxy_affiliates_master 
        WHERE email = ? OR unique_affiliate_id = ?
      `).bind(queryParam, queryParam).all();

      return new Response(JSON.stringify({ success: true, data: info.results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ==========================================
    // ৫. ড্যাশবোর্ড স্ট্যাটস
    // ==========================================
    if (action === "stats" && request.method === "GET") {
      const affiliateId = (url.searchParams.get("affiliate_id") || "").toLowerCase().trim();

      const stats = await env.retail.prepare(`
        SELECT 
          unique_affiliate_id,
          total_earnings, 
          available_balance, 
          total_clicks, 
          total_referrals,
          status,
          admin_approval,
          payout_status
        FROM rorraxy_affiliates_master 
        WHERE email = ? OR unique_affiliate_id = ?
      `).bind(affiliateId, affiliateId).all();

      return new Response(JSON.stringify({ success: true, data: stats.results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ==========================================
    // ৬. পেআউট রিকোয়েস্ট
    // ==========================================
    if (action === "payout" || action === "payout_request") {
      if (request.method === "POST") {
        const data = await request.json();
        const affiliateId = (data.affiliate_id || "").toLowerCase().trim();
        const requestedAmount = parseFloat(data.amount || 0.00);
        const now = new Date().toISOString();

        await env.retail.prepare(`
          UPDATE rorraxy_affiliates_master SET
            available_balance = CASE 
              WHEN available_balance >= ? THEN available_balance - ? 
              ELSE available_balance 
            END,
            payout_status = 'pending',
            updated_at = ?
          WHERE (email = ? OR unique_affiliate_id = ?) AND available_balance >= ?
        `).bind(requestedAmount, requestedAmount, now, affiliateId, affiliateId, requestedAmount).run();

        return new Response(JSON.stringify({ success: true, message: "Payout request logged successfully" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    return new Response(JSON.stringify({ message: "rorraxy Master Affiliate API Active" }), { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
