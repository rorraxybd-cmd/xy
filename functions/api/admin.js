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

    // ১. ভেরিফিকেশন রিকোয়েস্ট
    if (action === "verify") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const body = await request.json();
      const email = (body.email || "").toLowerCase();
      if (!email) {
        return new Response(JSON.stringify({ success: false, error: "Email required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const clientIp = request.headers.get("cf-connecting-ip") || "Unknown";
      const country = request.headers.get("cf-ipcountry") || "Unknown";
      const userAgent = request.headers.get("user-agent") || "Unknown";
      const now = new Date().toISOString();

      await env.retail.prepare(`
        INSERT INTO admin_info (email, is_verified, last_ip, ip_country, user_agent, verified_at, created_at)
        VALUES (?, 1, ?, ?, ?, ?, COALESCE((SELECT created_at FROM admin_info WHERE email = ?), ?))
        ON CONFLICT(email) DO UPDATE SET
          is_verified = 1,
          last_ip = excluded.last_ip,
          ip_country = excluded.ip_country,
          user_agent = excluded.user_agent,
          verified_at = excluded.verified_at
      `).bind(email, clientIp, country, userAgent, now, email, now).run();

      return new Response(JSON.stringify({ success: true, message: "Verified successfully" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ২. ইনফো ও পাসওয়ার্ড রেজিস্ট্রেশন / আপডেট
    if (action === "register" && request.method === "POST") {
      const data = await request.json();
      const email = (data.email || "").toLowerCase();
      const password = data.password || "";
      const clientIp = request.headers.get("cf-connecting-ip") || "Unknown";
      const country = request.headers.get("cf-ipcountry") || "Unknown";
      const userAgent = request.headers.get("user-agent") || "Unknown";
      const now = new Date().toISOString();

      if (!email) {
        return new Response(JSON.stringify({ success: false, error: "Email required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await env.retail.prepare(`
        INSERT INTO admin_info (
          email, first_name, last_name, phone, password_hash, is_verified, last_ip, ip_country, user_agent, verified_at, created_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, COALESCE((SELECT created_at FROM admin_info WHERE email = ?), ?))
        ON CONFLICT(email) DO UPDATE SET
          first_name = excluded.first_name,
          last_name = excluded.last_name,
          phone = excluded.phone,
          password_hash = COALESCE(NULLIF(excluded.password_hash, ''), admin_info.password_hash),
          last_ip = excluded.last_ip,
          ip_country = excluded.ip_country,
          user_agent = excluded.user_agent,
          verified_at = COALESCE(admin_info.verified_at, excluded.verified_at)
      `).bind(
        email,
        data.first_name || "",
        data.last_name || "",
        data.phone || "",
        password,
        clientIp,
        country,
        userAgent,
        now,
        email,
        now
      ).run();

      return new Response(JSON.stringify({ success: true, message: "Admin info saved successfully" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ৩. পাসওয়ার্ড ভেরিফিকেশন (লগইন)
    if (action === "login" && request.method === "POST") {
      const data = await request.json();
      const email = (data.email || "").toLowerCase();
      const inputPassword = data.password || "";

      const record = await env.retail.prepare(`SELECT password_hash FROM admin_info WHERE email = ?`).bind(email).first();
      
      if (!record) {
        return new Response(JSON.stringify({ success: false, error: "Admin profile not found!" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (record.password_hash && record.password_hash !== inputPassword) {
        return new Response(JSON.stringify({ success: false, error: "Incorrect password! Please try again." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ success: true, message: "Password verified" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ৪. প্রোফাইল ডাটা ফেচ (GET)
    if (action === "info" && request.method === "GET") {
      const email = url.searchParams.get("email");
      if (!email) {
        return new Response(JSON.stringify({ success: false, error: "Email required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const info = await env.retail.prepare(`SELECT email, first_name, last_name, phone, is_verified FROM admin_info WHERE email = ?`).bind(email.toLowerCase()).all();
      return new Response(JSON.stringify({ success: true, data: info.results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ message: "Admin API Active" }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
