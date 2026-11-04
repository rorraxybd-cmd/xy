export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { cjProductId, marginPercent = 50 } = await request.json();

    if (!cjProductId) {
      return new Response(JSON.stringify({ success: false, error: "CJ Product ID is required" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    // ১. CJ API Access Token জেনারেট করা (আপনার সেভ করা CJ_API_KEY ব্যবহার করে)
    const tokenRes = await fetch("https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: env.CJ_API_KEY })
    });
    
    const tokenData = await tokenRes.json();

    if (!tokenData.result || !tokenData.data?.accessToken) {
      return new Response(JSON.stringify({ success: false, error: "CJ Access Token fetch failed" }), {
        headers: { "Content-Type": "application/json" },
        status: 401
      });
    }

    const accessToken = tokenData.data.accessToken;

    // ২. CJ API থেকে প্রোডাক্টের তথ্য ফেচ করা
    const productRes = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${cjProductId}`, {
      headers: { "CJ-Access-Token": accessToken }
    });
    const productData = await productRes.json();

    if (!productData.result || !productData.data) {
      return new Response(JSON.stringify({ success: false, error: "Product not found on CJ Dropshipping" }), {
        headers: { "Content-Type": "application/json" },
        status: 404
      });
    }

    const p = productData.data;
    const baseCost = parseFloat(p.sellPrice || 0);

    // ৩. রিটেইল ও হোলসেল প্রফিট মার্জিন হিসাব (ব্যাসিক অটোমেশন)
    const marginMultiplier = 1 + (parseFloat(marginPercent) / 100);
    const retailPrice = (baseCost * marginMultiplier).toFixed(2);
    const wholesalePrice = (baseCost * (1 + ((parseFloat(marginPercent) * 0.6) / 100))).toFixed(2); // হোলসেলে মার্জিন ৬০% রাখা হয়েছে

    // ৪. D1 Database (retail)-এ প্রোডাক্ট সেভ করা
    await env.retail.prepare(`
      INSERT INTO products (
        cj_product_id, 
        vendor_type, 
        title, 
        price, 
        price_min_whole, 
        cj_cost_price, 
        image_url, 
        video_url, 
        upload_mode,
        stock,
        created_at
      ) VALUES (?, 'dropship', ?, ?, ?, ?, ?, ?, 'retail', ?, CURRENT_TIMESTAMP)
    `).bind(
      cjProductId,
      p.productNameEn || 'CJ Dropship Product',
      retailPrice,
      wholesalePrice,
      baseCost,
      p.productImage || '',
      p.productVideo || '',
      p.inventory || 500
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: "প্রোডাক্ট সফলভাবে D1 ডাটাবেজে ইমপোর্ট করা হয়েছে!",
      data: {
        title: p.productNameEn,
        cost: baseCost,
        retailPrice,
        wholesalePrice
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
