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
    // ১. ভেরিফিকেশন রিকোয়েস্ট (index.html থেকে)
    // ==========================================
    if (action === "send-magic-link" || action === "verify") {
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

      if (!email) {
        return new Response(JSON.stringify({ success: false, error: "Email required" }), { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      // ইউনিক অ্যাফিলিয়েট আইডি প্রডিউস করা (rorraxy_emailprefix_random)
      const emailPrefix = email.split('@')[0].replace(/[^a-z0-9]/gi, '');
      const randomSuffix = Math.random().toString(36).substring(2, 7) + Date.now().toString(36).slice(-3);
      const generatedUniqueId = `rorraxy_${emailPrefix}_${randomSuffix}`;
      const now = new Date().toISOString();

      await env.retail.prepare(`
        INSERT INTO rorraxy_affiliates_master (
          unique_affiliate_id, email, country_code, phone, auth_provider, status, admin_approval, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'email', 'active', 'pending', ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          country_code = excluded.country_code,
          phone = CASE WHEN excluded.phone != '' THEN excluded.phone ELSE rorraxy_affiliates_master.phone END,
          updated_at = excluded.updated_at
      `).bind(generatedUniqueId, email, countryCode, phone, now, now).run();

      // বর্তমান ইউনিক আইডি ফেচ করা
      const currentRecord = await env.retail.prepare(
        `SELECT unique_affiliate_id FROM rorraxy_affiliates_master WHERE email = ?`
      ).bind(email).first();

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Verified successfully", 
        unique_affiliate_id: currentRecord?.unique_affiliate_id || generatedUniqueId 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ==========================================
    // ২. প্রোফাইল ইনফো রেজিস্টার ও আপডেট (info.html থেকে)
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
          auth_provider = COALESCE(NULLIF(?, ''), auth_provider),
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
        data.auth_provider || "email",
        now,
        email
      ).run();

      return new Response(JSON.stringify({ success: true, message: "Affiliate info updated successfully" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ==========================================
    // ৩. প্রোফাইল ডাটা ফেচ (GET - info.html)
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
    // ৪. ড্যাশবোর্ড স্ট্যাটস (dashboard.html)
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
    // ৫. ট্র্যাকিং লিংক সেভ ও ক্লিক কাউন্ট (links.html)
    // ==========================================
    if (action === "conversion" && request.method === "POST") {
      const data = await request.json();
      const affiliateId = (data.affiliate_id || "").toLowerCase().trim();
      const generatedLink = data.tracking_link || data.platform_name || "";
      const commissionAmount = parseFloat(data.commission_amount || 0.00);
      const now = new Date().toISOString();

      await env.retail.prepare(`
        UPDATE rorraxy_affiliates_master SET
          total_clicks = total_clicks + 1,
          total_earnings = total_earnings + ?,
          available_balance = available_balance + ?,
          total_referrals = CASE WHEN ? > 0 THEN total_referrals + 1 ELSE total_referrals END,
          last_generated_link = COALESCE(NULLIF(?, ''), last_generated_link),
          updated_at = ?
        WHERE email = ? OR unique_affiliate_id = ?
      `).bind(commissionAmount, commissionAmount, commissionAmount, generatedLink, now, affiliateId, affiliateId).run();

      return new Response(JSON.stringify({ success: true, message: "Link activity & metrics updated" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ==========================================
    // ৬. পেআউট স্ট্যাটাস ও আপডেট (payout.html)
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

      if (request.method === "GET") {
        const affiliateId = (url.searchParams.get("affiliate_id") || "").toLowerCase().trim();
        const payouts = await env.retail.prepare(`
          SELECT 
            unique_affiliate_id,
            email,
            payment_method,
            account_details,
            available_balance,
            total_earnings,
            payout_status
          FROM rorraxy_affiliates_master 
          WHERE email = ? OR unique_affiliate_id = ?
        `).bind(affiliateId, affiliateId).all();

        return new Response(JSON.stringify({ success: true, data: payouts.results }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ==========================================
    // ৭. মাল্টি-ডিভাইস সিঙ্ক টোকেন হ্যান্ডলার (dashboard.html)
    // ==========================================
    if (action === "sync_token" && request.method === "POST") {
      const data = await request.json();
      const affiliateId = (data.affiliate_id || "").toLowerCase().trim();
      const syncToken = data.sync_token || "";
      const now = new Date().toISOString();

      await env.retail.prepare(`
        UPDATE rorraxy_affiliates_master SET
          sync_token = ?,
          updated_at = ?
        WHERE email = ? OR unique_affiliate_id = ?
      `).bind(syncToken, now, affiliateId, affiliateId).run();

      return new Response(JSON.stringify({ success: true, message: "Sync token saved" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ==========================================
    // ৮. অ্যাডমিন কন্ট্রোল ও ফিল্টার এপিআই (Admin Panel Management)
    // ==========================================
    if (action === "admin_update" && request.method === "POST") {
      const data = await request.json();
      const targetAffiliateId = (data.affiliate_id || "").toLowerCase().trim();
      const now = new Date().toISOString();

      await env.retail.prepare(`
        UPDATE rorraxy_affiliates_master SET
          status = COALESCE(?, status),
          admin_approval = COALESCE(?, admin_approval),
          admin_remarks = COALESCE(?, admin_remarks),
          payout_status = COALESCE(?, payout_status),
          updated_at = ?
        WHERE email = ? OR unique_affiliate_id = ?
      `).bind(
        data.status || null,
        data.admin_approval || null,
        data.admin_remarks || null,
        data.payout_status || null,
        now,
        targetAffiliateId,
        targetAffiliateId
      ).run();

      return new Response(JSON.stringify({ success: true, message: "Admin update successful" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
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
