export async function onRequest(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action"); // info, conversion, payout, stats
    const affiliateId = url.searchParams.get("affiliate_id") || url.searchParams.get("email");

    // ১. GET রিকোয়েস্ট: ইনফো, কনভার্শন, পেআউট বা স্ট্যাটস দেখার জন্য
    if (request.method === "GET") {
      let query = "";
      let stmt;

      if (action === "info") {
        query = affiliateId ? "SELECT * FROM affiliate_info WHERE email = ? OR affiliate_id = ?" : "SELECT * FROM affiliate_info";
        stmt = affiliateId ? env.retail.prepare(query).bind(affiliateId, affiliateId) : env.retail.prepare(query);
      } else if (action === "conversion") {
        query = affiliateId ? "SELECT * FROM affiliate_conversion WHERE affiliate_id = ?" : "SELECT * FROM affiliate_conversion";
        stmt = affiliateId ? env.retail.prepare(query).bind(affiliateId) : env.retail.prepare(query);
      } else if (action === "payout") {
        query = affiliateId ? "SELECT * FROM affiliate_payout WHERE affiliate_id = ?" : "SELECT * FROM affiliate_payout";
        stmt = affiliateId ? env.retail.prepare(query).bind(affiliateId) : env.retail.prepare(query);
      } else if (action === "stats") {
        query = affiliateId ? "SELECT * FROM affiliate_stats WHERE affiliate_id = ?" : "SELECT * FROM affiliate_stats";
        stmt = affiliateId ? env.retail.prepare(query).bind(affiliateId) : env.retail.prepare(query);
      } else {
        return new Response(JSON.stringify({ success: false, error: "Invalid action parameter" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const { results } = await stmt.all();
      return new Response(JSON.stringify({ success: true, data: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ২. POST রিকোয়েস্ট: রেজিস্ট্রেশন, কনভার্শন বা পেআউট রিকোয়েস্ট সাবমিট করার জন্য
    if (request.method === "POST") {
      const body = await request.json();

      // ক্যাটাগরি ১: রেজিস্টার বা ইনফো আপডেট (UPSERT লজিক সহ যাতে ডুপ্লিকেট এরর না খায়)
      if (action === "register") {
        const {
          first_name, last_name, email, phone, promo_channel,
          payment_method, account_details, auth_provider, auth_id
        } = body;

        const query = `
          INSERT INTO affiliate_info (
            first_name, last_name, email, phone, promo_channel,
            payment_method, account_details, auth_provider, auth_id, approval_status, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', datetime('now'))
          ON CONFLICT(email) DO UPDATE SET
            first_name = excluded.first_name,
            last_name = excluded.last_name,
            phone = excluded.phone,
            promo_channel = excluded.promo_channel,
            payment_method = excluded.payment_method,
            account_details = excluded.account_details,
            updated_at = datetime('now')
        `;

        await env.retail.prepare(query).bind(
          first_name || null, last_name || null, email || null, phone || null,
          promo_channel || null, payment_method || null, account_details || null,
          auth_provider || "google", auth_id || email
        ).run();

        return new Response(JSON.stringify({ success: true, message: "Affiliate registered successfully!" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // ক্যাটাগরি ২: কনভার্শন ট্র্যাক
      if (action === "conversion") {
        const { affiliate_id, order_id, platform_name, commission_amount } = body;

        const query = `
          INSERT INTO affiliate_conversion (
            affiliate_id, order_id, platform_name, commission_amount, status, created_at
          ) VALUES (?, ?, ?, ?, 'PENDING', datetime('now'))
        `;

        await env.retail.prepare(query).bind(
          affiliate_id, order_id || null, platform_name || null, commission_amount || 0
        ).run();

        return new Response(JSON.stringify({ success: true, message: "Conversion recorded successfully!" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json`" }
        });
      }

      // ক্যাটাগরি ৩: পেআউট রিকোয়েস্ট
      if (action === "payout_request") {
        const { affiliate_id, payment_method, amount } = body;

        const query = `
          INSERT INTO affiliate_payout (
            affiliate_id, request_date, payment_method, amount, status
          ) VALUES (?, datetime('now'), ?, ?, 'PENDING')
        `;

        await env.retail.prepare(query).bind(
          affiliate_id, payment_method || null, amount || 0
        ).run();

        return new Response(JSON.stringify({ success: true, message: "Payout request submitted successfully!" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ success: true, error: "Invalid post action" }), {
        status: 400,
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
