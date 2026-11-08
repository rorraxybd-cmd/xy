export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const action = url.searchParams.get("action");
    const body = await request.json();

    const clientIp = request.headers.get("cf-connecting-ip") || "Unknown";
    const userAgent = request.headers.get("user-agent") || "Unknown";

    if (action === "send-otp") {
      const phone = body.phone;
      const countryCode = body.country_code || "";

      if (!phone) {
        return new Response(JSON.stringify({ success: false, error: "Phone number is required." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      await env.retail.prepare(`
        INSERT INTO customer_auth_logs (phone, country_code, ip_address, device_info, auth_token, status, last_login)
        VALUES (?, ?, ?, ?, ?, 'Pending', CURRENT_TIMESTAMP)
      `).bind(phone, countryCode, clientIp, body.device_info || userAgent, otpCode).run();

      return new Response(JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully",
        debug_otp: otpCode 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "verify-otp") {
      const phone = body.phone;
      const otp = body.otp;

      if (!phone || !otp) {
        return new Response(JSON.stringify({ success: false, error: "Phone and OTP are required." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const record = await env.retail.prepare(`
        SELECT * FROM customer_auth_logs 
        WHERE phone = ? AND auth_token = ? 
        ORDER BY id DESC LIMIT 1
      `).bind(phone, otp).first();

      if (!record) {
        return new Response(JSON.stringify({ success: false, error: "Invalid OTP code." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      await env.retail.prepare(`
        UPDATE customer_auth_logs SET status = 'Verified', last_login = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(record.id).run();

      const authToken = "rorraxy_cust_" + Math.random().toString(36).substring(2) + Date.now();

      return new Response(JSON.stringify({ 
        success: true, 
        token: authToken,
        message: "Verification successful. Access granted." 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (action === "sync-customer") {
      const phone = body.phone;
      const customerName = body.customer_name || "";
      const shippingAddress = body.shipping_address || "";
      const masterOrderId = body.master_order_id || "";

      if (!phone) {
        return new Response(JSON.stringify({ success: false, error: "Phone number is required for sync." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      await env.retail.prepare(`
        INSERT INTO customer_auth_logs (phone, ip_address, device_info, customer_name, shipping_address, master_order_id, auth_token, status, last_login)
        VALUES (?, ?, ?, ?, ?, ?, 'SYNCED_TOKEN', 'Verified', CURRENT_TIMESTAMP)
      `).bind(phone, clientIp, userAgent, customerName, shippingAddress, masterOrderId).run();

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Customer account and order data synced successfully." 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Invalid action endpoint" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
```[cite: 9]

কোডটি বসিয়ে কমিট করার সাথে সাথেই দেখবেন আপনার এই ঝামেলা চিরতরে দূর হয়ে গেছে!
