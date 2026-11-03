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
    // ১. ম্যাজিক লিংক জেনারেট
    // ==========================================
    if (url.pathname.includes("/send-magic-link") || action === "send-magic-link") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { email } = await request.json();
      if (!email) {
        return new Response(JSON.stringify({ error: "Email required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const token = crypto.randomUUID();
      const expiresAt = Date.now() + 180 * 1000;

      await env.retail.prepare(`
        INSERT INTO verification_tokens (token, email, expires_at)
        VALUES (?, ?, ?)
      `).bind(token, email.toLowerCase(), expiresAt).run();

      const magicLink = `https://${url.hostname}/api/affiliate/verify-magic?token=${token}`;

      return new Response(JSON.stringify({ success: true, magicLink }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ==========================================
    // ২. ম্যাজিক লিংক ভেরিফিকেশন ও সিকিউরিটি লগ
    // ==========================================
    if (url.pathname.includes("/verify-magic") || action === "verify-magic") {
      const token = url.searchParams.get("token");
      if (!token) return new Response("Invalid Token", { status: 400 });

      const record = await env.retail.prepare(`
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

      await env.retail.prepare(`
        INSERT INTO affiliate_info (email, is_verified, last_ip, ip_country, user_agent, verified_at, created_at)
        VALUES (?, 1, ?, ?, ?, ?, COALESCE((SELECT created_at FROM affiliate_info WHERE email = ?), ?))
        ON CONFLICT(email) DO UPDATE SET
          is_verified = 1,
          last_ip = excluded.last_ip,
          ip_country = excluded.ip_country,
          user_agent = excluded.user_agent,
          verified_at = excluded.verified_at
      `).bind(email, clientIp, country, userAgent, now, email, now).run();

      await env.retail.prepare(`DELETE FROM verification_tokens WHERE token = ?`).bind(token).run();

      return Response.redirect(`https://${url.hostname}/affiliate/dashboard.html?verified=true`, 302);
    }

    // ==========================================
    // ৩. অ্যাফিলিয়েট ইনফো সেভ ও রেজিস্ট্রেশন
    // ==========================================
    if (action === "register" && request.method === "POST") {
      const data = await request.json();
      const email = (data.email || "").toLowerCase();
      const clientIp = request.headers.get("cf-connecting-ip") || "Unknown";
      const country = request.headers.get("cf-ipcountry") || "Unknown";
      const userAgent = request.headers.get("user-agent") || "Unknown";
      const now = new Date().toISOString();

      if (!email) {
        return new Response(JSON.stringify({ success: false, error: "Email required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await env.retail.prepare(`
        INSERT INTO affiliate_info (
          email, first_name, last_name, phone, promo_channel, payment_method, account_details, 
          auth_provider, auth_id, is_verified, last_ip, ip_country, user_agent, verified_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, COALESCE((SELECT created_at FROM affiliate_info WHERE email = ?), ?))
        ON CONFLICT(email) DO UPDATE SET
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          phone = excluded.phone,
          promo_channel = excluded.promo_channel,
          payment_method = excluded.payment_method,
          account_details = excluded.account_details,
          last_ip = excluded.last_ip,
          ip_country = excluded.ip_country,
          user_agent = excluded.user_agent,
          verified_at = COALESCE(affiliate_info.verified_at, excluded.verified_at)
      `).bind(
        email,
        data.first_name || "",
        data.last_name || "",
        data.phone || "",
        data.promo_channel || "",
        data.payment_method || "",
        data.account_details || "",
        data.auth_provider || "email",
        data.auth_id || email,
        clientIp,
        country,
        userAgent,
        now,
        email,
        now
      ).run();

      return new Response(JSON.stringify({ success: true, message: "Affiliate info saved successfully" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "info" && request.method === "GET") {
      const affiliateId = url.searchParams.get("affiliate_id");
      if (!affiliateId) {
        return new Response(JSON.stringify({ success: false, error: "Affiliate ID required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const info = await env.retail.prepare(`SELECT * FROM affiliate_info WHERE email = ?`).bind(affiliateId.toLowerCase()).all();
      return new Response(JSON.stringify({ success: true, data: info.results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ==========================================
    // ৪. কনভার্শন এবং ক্লিক লগ (reports.html ও links.html এর জন্য)
    // ==========================================
    if (action === "conversion") {
      if (request.method === "POST") {
        const data = await request.json();
        const affiliateId = (data.affiliate_id || "").toLowerCase();
        const now = new Date().toISOString();

        await env.retail.prepare(`
          INSERT INTO affiliate_conversions (affiliate_id, order_id, platform_name, commission_amount, status, created_at)
          VALUES (?, ?, ?, ?, 'PENDING', ?)
        `).bind(
          affiliateId,
          data.order_id || `LINK_${Date.now()}`,
          data.platform_name || 'Retail Store',
          data.commission_amount || 0.00,
          now
        ).run();

        return new Response(JSON.stringify({ success: true, message: "Conversion logged successfully" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (request.method === "GET") {
        const affiliateId = url.searchParams.get("affiliate_id");
        const conversions = await env.retail.prepare(`SELECT * FROM affiliate_conversions WHERE affiliate_id = ? ORDER BY id DESC`).bind((affiliateId || "").toLowerCase()).all();
        
        return new Response(JSON.stringify({ success: true, data: conversions.results }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ==========================================
    // ৫. পেআউট রিকোয়েস্ট এবং হিস্ট্রি (payout.html এর জন্য)
    // ==========================================
    if (action === "payout" || action === "payout_request") {
      if (request.method === "POST") {
        const data = await request.json();
        const affiliateId = (data.affiliate_id || "").toLowerCase();
        const now = new Date().toISOString();

        await env.retail.prepare(`
          INSERT INTO affiliate_payouts (affiliate_id, payment_method, amount, status, request_date)
          VALUES (?, ?, ?, 'PENDING', ?)
        `).bind(
          affiliateId,
          data.payment_method || 'bKash',
          data.amount || 0.00,
          now
        ).run();

        return new Response(JSON.stringify({ success: true, message: "Payout request submitted" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      if (request.method === "GET") {
        const affiliateId = url.searchParams.get("affiliate_id");
        const payouts = await env.retail.prepare(`SELECT * FROM affiliate_payouts WHERE affiliate_id = ? ORDER BY id DESC`).bind((affiliateId || "").toLowerCase()).all();
        
        return new Response(JSON.stringify({ success: true, data: payouts.results }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ==========================================
    // ৬. ড্যাশবোর্ড স্ট্যাটস বা সামারি (dashboard.html এর জন্য)
    // ==========================================
    if (action === "stats" && request.method === "GET") {
      const affiliateId = (url.searchParams.get("affiliate_id") || "").toLowerCase();

      const commRes = await env.retail.prepare(`
        SELECT SUM(commission_amount) as total_earnings 
        FROM affiliate_conversions 
        WHERE affiliate_id = ? AND status IN ('CONFIRMED', 'PAID')
      `).bind(affiliateId).first();

      const clickRes = await env.retail.prepare(`
        SELECT COUNT(*) as total_clicks 
        FROM affiliate_conversions 
        WHERE affiliate_id = ?
      `).bind(affiliateId).first();

      const totalEarnings = commRes?.total_earnings || 0.00;
      const totalClicks = clickRes?.total_clicks || 0;

      const statsData = [{
        total_earnings: totalEarnings,
        available_balance: totalEarnings,
        total_clicks: totalClicks,
        total_referrals: totalClicks
      }];

      return new Response(JSON.stringify({ success: true, data: statsData }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ message: "Affiliate Centralized API Active" }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
