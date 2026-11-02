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
    const type = url.searchParams.get("type"); // retail, dropship, wholesale
    const orderId = url.searchParams.get("order_id");

    // ১. GET রিকোয়েস্ট: অর্ডারগুলো দেখার জন্য (আউটপুট)
    if (request.method === "GET") {
      let tableName = "";
      if (type === "retail") tableName = "retail_orders";
      else if (type === "dropship") tableName = "dropship_orders";
      else if (type === "wholesale") tableName = "wholesale_orders";
      else {
        return new Response(JSON.stringify({ success: false, error: "Invalid order type parameter" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      let query = `SELECT * FROM ${tableName}`;
      let stmt;
      if (orderId) {
        query += ` WHERE order_id = ?`;
        stmt = env.retail.prepare(query).bind(orderId);
      } else {
        stmt = env.retail.prepare(query);
      }

      const { results } = await stmt.all();
      return new Response(JSON.stringify({ success: true, data: results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ২. POST রিকোয়েস্ট: চেকআউট ফর্ম থেকে সমস্ত তথ্য নিয়ে অর্ডারে ইনপুট দেওয়ার জন্য
    if (request.method === "POST") {
      const body = await request.json();

      // ক্যাটাগরি ১: রিটেইল অর্ডার (retail_orders)
      if (type === "retail") {
        const {
          master_order_id,
          customer_name,
          customer_phone,
          shipping_address,
          customer_country,
          payment_method,
          payment_status,
          transaction_id,
          total_amount,
          currency,
          affiliate_id,
          affiliate_commission,
          admin_commission,
          order_status
        } = body;

        const query = `
          INSERT INTO retail_orders (
            master_order_id, customer_name, customer_phone, shipping_address,
            customer_country, payment_method, payment_status, transaction_id,
            total_amount, currency, affiliate_id, affiliate_commission,
            admin_commission, order_status, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `;

        await env.retail.prepare(query).bind(
          master_order_id || null,
          customer_name || null,
          customer_phone || null,
          shipping_address || null,
          customer_country || "Bangladesh",
          payment_method || null,
          payment_status || "Pending",
          transaction_id || "",
          total_amount || 0,
          currency || "USD",
          affiliate_id || "AFF-DIRECT",
          affiliate_commission || 0,
          admin_commission || 0,
          order_status || "Pending"
        ).run();

        return new Response(JSON.stringify({ success: true, message: "Retail order placed successfully!" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // ক্যাটাগরি ২: ড্রপশিপ অর্ডার (dropship_orders)
      else if (type === "dropship") {
        // ড্রপশিপ টেবিলের কলাম অনুযায়ী এখানে ডেটা সেভ হবে
        return new Response(JSON.stringify({ success: true, message: "Dropship order feature is ready to map!" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // ক্যাটাগরি ৩: হোলসেল অর্ডার (wholesale_orders)
      else if (type === "wholesale") {
        // হোলসেল টেবিলের কলাম অনুযায়ী এখানে ডেটা সেভ হবে
        return new Response(JSON.stringify({ success: true, message: "Wholesale order feature is ready to map!" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify({ success: false, error: "Invalid order type for POST" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
