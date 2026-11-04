export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { cjProductId, retailMargin, shippingCushion, wholesaleMargin } = await request.json();

    if (!cjProductId) {
      return new Response(JSON.stringify({ success: false, error: "CJ Product ID is required" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    // ১. CJ API Access Token জেনারেট করা
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

    // ২. CJ API থেকে প্রোডাক্টের ডিটেইলস ফেচ করা
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

    // সঠিক বেস কস্ট বা প্রাইস ফিল্ড ট্র্যাক করা (undefined সমস্যা সমাধান)
    const baseCost = parseFloat(p.sellPrice || p.productPrice || p.discountPrice || 0);

    // ৩. ডায়নামিক প্রাইসিং ক্যালকুলেশন
    const rMargin = retailMargin ? (1 + parseFloat(retailMargin) / 100) : 1.70;
    const shipFee = shippingCushion ? parseFloat(shippingCushion) : 6.00;
    const wMargin = wholesaleMargin ? (1 + parseFloat(wholesaleMargin) / 100) : 1.25;

    const retailPrice = ((baseCost * rMargin) + shipFee).toFixed(2);
    const wholesalePrice = (baseCost * wMargin).toFixed(2);

    const mainImage = p.productImage || '';
    const imagesList = p.productImageList ? JSON.stringify(p.productImageList) : JSON.stringify([mainImage]);
    const videoUrl = p.productVideo || '';
    
    // ফুল ডেসক্রিপশন হ্যান্ডেলিং
    const fullDescription = p.description || p.productNameEn || 'High-grade global product with professional specifications.';

    // ৪. D1 Database-এ ডেটা ইনসার্ট করা
    await env.retail.prepare(`
      INSERT INTO products (
        cj_product_id, 
        vendor_type, 
        title, 
        description,
        price, 
        price_min_whole, 
        cj_cost_price, 
        image_url, 
        images_json,
        video_url, 
        upload_mode,
        stock,
        created_at
      ) VALUES (?, 'dropship', ?, ?, ?, ?, ?, ?, ?, ?, 'retail', ?, CURRENT_TIMESTAMP)
    `).bind(
      cjProductId,
      p.productNameEn || 'Global Custom Product',
      fullDescription,
      retailPrice,
      wholesalePrice,
      baseCost,
      mainImage,
      imagesList,
      videoUrl,
      p.inventory || 500
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: "প্রোডাক্টের ফুল ডেসক্রিপশনসহ D1 ডাটাবেজে সফলভাবে আপডেট ও সেভ হয়েছে!",
      data: { 
        title: p.productNameEn, 
        baseCost: baseCost.toFixed(2),
        retailPrice, 
        wholesalePrice 
      }
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
