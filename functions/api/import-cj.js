export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { cjProductId, customMargin } = await request.json();

    if (!cjProductId) {
      return new Response(JSON.stringify({ success: false, error: "CJ Product ID is required" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    // ১. CJ API Access Token জেনারেট করা (আপনার ক্লাউডফ্লেয়ারে সেভ করা CJ_API_KEY ব্যবহার করে)
    const tokenRes = await fetch("https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: env.CJ_API_KEY })
    });
    
    const tokenData = await tokenRes.json();
    if (!tokenData.result || !tokenData.data?.accessToken) {
      return new Response(JSON.stringify({ success: false, error: "CJ Access Token authentication failed" }), {
        headers: { "Content-Type": "application/json" },
        status: 401
      });
    }

    const accessToken = tokenData.data.accessToken;

    // ২. CJ API থেকে প্রোডাক্টের সমস্ত ডিটেইলস ফেচ করা
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

    // ৩. গ্লোবাল ফিক্সড প্রফিট ও প্রাইসিং লজিক
    // রিটেইল: বেস কস্ট + ৭০% মার্জিন + $৬ গ্লোবাল ফ্রি শিপিং ও ১০% অ্যাফিলিয়েট কুশন
    const marginMultiplier = customMargin ? (1 + parseFloat(customMargin) / 100) : 1.70;
    const retailPrice = ((baseCost * marginMultiplier) + 6).toFixed(2);
    
    // হোলসেল স্যাম্পল / বেস প্রাইস: ২৫% মার্জিন (শিপিং ও বাল্ক নেগোসিয়েশন আলাদা)
    const wholesalePrice = (baseCost * 1.25).toFixed(2);

    // ৪. D1 Database (retail)-এ প্রোডাক্ট অটো-সেভ করা
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
      p.productNameEn || 'Global Custom Product',
      retailPrice,
      wholesalePrice,
      baseCost,
      p.productImage || '',
      p.productVideo || '',
      p.inventory || 500
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: "প্রোডাক্ট সফলভাবে গ্লোবাল প্রাইসিং সহ D1 ডাটাবেজে আপডেট ও সেভ হয়েছে!",
      data: {
        title: p.productNameEn,
        cost: baseCost,
        retailPrice: `${retailPrice} (Free Shipping & 10% Aff. Ready)`,
        wholesalePrice: `${wholesalePrice} (Bulk/Sample Base - 2% Aff. Ready)`
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
