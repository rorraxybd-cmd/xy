export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  try {
    const { request, env } = context;
    const data = await request.json();
    const { country, fullName, email, whatsapp, budget, strategicPlan } = data;

    if (!country || !fullName || !email || !whatsapp || !budget || !strategicPlan) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const query = `
      INSERT INTO managing_directors (country, fullName, email, whatsapp, budget, strategicPlan, status)
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `;

    await env.retail.prepare(query)
      .bind(country, fullName, email, whatsapp, Number(budget), strategicPlan)
      .run();

    return new Response(JSON.stringify({ success: true, message: "Submitted successfully to Cloudflare D1!" }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
