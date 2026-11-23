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
    
    // ✅ নতুন ফিল্ডগুলো যুক্ত করা হয়েছে (dialCode, affiliateRef)
    const { 
      fullName, 
      email, 
      whatsapp, 
      budget, 
      projectDetails, 
      country, 
      countryCode, 
      dialCode, 
      ipAddress, 
      affiliateRef 
    } = data;

    if (!fullName || !email || !whatsapp || !budget || !projectDetails) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // ✅ SQL কুয়েরিতে নতুন কলামগুলো যুক্ত করা হয়েছে
    const query = `
      INSERT INTO project_requests (
        fullName, 
        email, 
        whatsapp, 
        budget, 
        projectDetails, 
        country, 
        countryCode, 
        dialCode, 
        ipAddress, 
        affiliate_ref, 
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `;

    await env.retail.prepare(query)
      .bind(
        fullName,
        email,
        whatsapp,
        Number(budget),
        projectDetails,
        country || 'Global Region',
        countryCode || 'un',
        dialCode || '',
        ipAddress || '',
        affiliateRef || 'Direct/None'
      )
      .run();

    return new Response(JSON.stringify({ success: true, message: "Submitted successfully to Cloudflare!" }), {
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
