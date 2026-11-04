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

    // ৩. রিটেইল এবং হোলসেলের আলাদা ডাইনামিক প্রাইসিং ক্যালকুলেশন
    const rMargin = retailMargin ? (1 + parseFloat(retailMargin) / 100) : 1.70;
    const shipFee = shippingCushion ? parseFloat(shippingCushion) : 6.00;
    const wMargin = wholesaleMargin ? (1 + parseFloat(wholesaleMargin) / 100) : 1.25;

    // রিটেইল প্রাইস: বেস কস্ট + রিটেইল মার্জিন + কাস্টম শিপিং কুশন (ফ্রি শিপিংয়ের জন্য)
    const retailPrice = ((baseCost * rMargin) + shipFee).toFixed(2);
    
    // হোলসেল স্যাম্পল প্রাইস: বেস কস্ট + হোলসেল মার্জিন (শিপিং আলাদা)
    const wholesalePrice = (baseCost * wMargin).toFixed(2);

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
      message: "প্রোডাক্ট সফলভাবে রিটেইল ও হোলসেল প্রাইসিং সহ D1 ডাটাবেজে সেভ হয়েছে!",
      data: {
        title: p.productNameEn,
        cost: baseCost,
        retailPrice: `${retailPrice} (Includes $${shipFee} Shipping Cushion & 10% Aff.)`,
        wholesalePrice: `${wholesalePrice} (Wholesale Sample/Bulk Base - 2% Aff.)`
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
