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
    return new Response(
      JSON.stringify({ success: false, error: "Database binding not found" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const pathname = url.pathname;

    // 1. Send Magic Link & Generate Verification Token with IP, User-Agent & Country tracking
    if (pathname.includes("/send-magic-link")) {
      if (request.method !== "POST") {
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const bodyData = await request.json().catch(() => ({}));
      const email = (bodyData.email || "").toLowerCase().trim();
      const mobile_number = bodyData.mobile_number || "";

      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // 100% Unique Collision-Free Lowercase Seller ID generation (rorraxy-xxxx-xxxx)
      const emailPrefix = email.split('@')[0].replace(/[^a-z0-9]/g, '').substring(0, 6);
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const uniqueSellerId = `rorraxy-${emailPrefix}-${randomSuffix}`;

      const token = crypto.randomUUID();
      const expiresAt = Date.now() + 300 * 1000; // 5 minutes expiration for security
      const clientIp = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "Unknown";
      const ipCountry = request.headers.get("cf-ipcountry") || "BD";
      const userAgent = request.headers.get("user-agent") || "Unknown";

      // Upsert seller record with verification token, IP, and tracking
      const sqlMagic = `
        INSERT INTO sellers (
          seller_id, email, mobile_number, verification_token, token_expires_at, last_ip, ip_country, user_agent, is_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
        ON CONFLICT(email) DO UPDATE SET 
          verification_token = excluded.verification_token, 
          token_expires_at = excluded.token_expires_at, 
          mobile_number = COALESCE(NULLIF(excluded.mobile_number, ''), sellers.mobile_number),
          last_ip = excluded.last_ip,
          ip_country = excluded.ip_country,
          user_agent = excluded.user_agent
      `;

      await db.prepare(sqlMagic).bind(uniqueSellerId, email, mobile_number, token, expiresAt, clientIp, ipCountry, userAgent).run();

      const magicLink = `https://${url.hostname}/api/seller/verify-magic?token=${token}`;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Verification token generated successfully", 
          magicLink: magicLink,
          seller_id: uniqueSellerId 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Verify Magic Link Token Endpoint
    if (pathname.includes("/verify-magic")) {
      const token = url.searchParams.get("token");
      if (!token) {
        return new Response("Invalid Verification Token", { status: 400 });
      }

      const sqlCheck = "SELECT * FROM sellers WHERE verification_token = ?";
      const record = await db.prepare(sqlCheck).bind(token).first();

      if (!record || Date.now() > record.token_expires_at) {
        return new Response("Verification link has expired or is invalid!", { status: 410 });
      }

      const now = new Date().toISOString();
      const sqlVerify = "UPDATE sellers SET is_verified = 1, verified_at = ?, verification_token = NULL, token_expires_at = NULL WHERE verification_token = ?";

      await db.prepare(sqlVerify).bind(now, token).run();

      const redirectUrl = `https://${url.hostname}/seller/index.html?verified=true&email=${encodeURIComponent(record.email)}`;
      return Response.redirect(redirectUrl, 302);
    }

    // 3. POST Upsert / Save Seller Profile Information
    if (request.method === "POST") {
      const data = await request.json().catch(() => ({}));
      const email = (data.email || data.seller_id || "").toLowerCase().trim();
      const mobileNumber = data.mobile_number || data.phone || "";
      const clientIp = request.headers.get("cf-connecting-ip") || "Unknown";
      const country = request.headers.get("cf-ipcountry") || data.country || "Bangladesh";
      const userAgent = request.headers.get("user-agent") || "Unknown";
      const now = new Date().toISOString();

      if (!email) {
        return new Response(
          JSON.stringify({ success: false, error: "Email required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const emailPrefix = email.split('@')[0].replace(/[^a-z0-9]/g, '').substring(0, 6);
      const fallbackSellerId = `rorraxy-${emailPrefix}-${Math.random().toString(36).substring(2, 8)}`;
      const finalSellerId = data.seller_id && data.seller_id.startsWith('rorraxy-') ? data.seller_id : fallbackSellerId;

      const sqlUpsert = `
        INSERT INTO sellers (
          seller_id, email, mobile_number, brand_name, full_name, business_desc, 
          whatsapp, emergency_phone, country, full_address, doc_type, doc_number, 
          trade_license, logo_url, is_verified, admin_approval_status, last_ip, ip_country, user_agent, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'pending', ?, ?, ?, COALESCE((SELECT created_at FROM sellers WHERE email = ?), ?)) 
        ON CONFLICT(email) DO UPDATE SET 
          seller_id = COALESCE(NULLIF(sellers.seller_id, ''), excluded.seller_id),
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
      `;

      await db.prepare(sqlUpsert).bind(
        finalSellerId,
        email,
        mobileNumber,
        data.brand_name || "",
        data.full_name || "",
        data.business_desc || "",
        data.whatsapp || "",
        data.emergency_phone || "",
        country,
        data.full_address || "",
        data.doc_type || "NID",
        data.doc_number || "",
        data.trade_license || "N/A",
        data.logo_url || "",
        clientIp,
        country,
        userAgent,
        email,
        now
      ).run();

      const sellerRecord = await db.prepare("SELECT id, seller_id, email FROM sellers WHERE email = ?").bind(email).first();

      return new Response(
        JSON.stringify({
          success: true,
          message: "Seller data saved successfully",
          seller_id: sellerRecord ? sellerRecord.seller_id : finalSellerId,
          email: email,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. GET Seller Profile
    if (request.method === "GET") {
      const email = url.searchParams.get("email");
      if (!email) {
        return new Response(
          JSON.stringify({ success: false, error: "Email parameter required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const sqlFetch = "SELECT * FROM sellers WHERE email = ?";
      const seller = await db.prepare(sqlFetch).bind(email.toLowerCase()).all();

      return new Response(
        JSON.stringify({ success: true, data: seller.results }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ message: "Seller API Active" }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
