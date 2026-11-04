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

    // ১. CJ Access Token
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

    // ২. Query Product Details
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
    const baseCost = parseFloat(p.sellPrice || p.productPrice || p.discountPrice || 0);

    // ৩. Pricing Calculations
    const rMargin = retailMargin ? (1 + parseFloat(retailMargin) / 100) : 1.70;
    const shipFee = shippingCushion ? parseFloat(shippingCushion) : 6.00;
    const wMargin = wholesaleMargin ? parseFloat(wholesaleMargin) / 100 : 0.25;

    const retailPrice = ((baseCost * rMargin) + shipFee).toFixed(2);
    const priceSample = (baseCost * (1 + wMargin)).toFixed(2);
    const priceMinWhole = (baseCost * (1 + (wMargin * 0.75))).toFixed(2);
    const priceBulk = (baseCost * (1 + (wMargin * 0.5))).toFixed(2);

    const mainImage = p.productImage || '';
    const imagesList = p.productImageList ? JSON.stringify(p.productImageList) : JSON.stringify([mainImage]);
    const videoUrl = p.productVideo || '';
    const fullDescription = p.description || p.productNameEn || 'High-grade global product.';

    // ৪. Save to D1 (upload_mode = 'both' সেট করা হয়েছে যাতে রিটেইল ও হোলসেল দুটো পেজেই পায়)
    await env.retail.prepare(`
      INSERT INTO products (
        cj_product_id, 
        vendor_type, 
        title, 
        description,
        price, 
        price_sample,
        price_min_whole, 
        price_bulk,
        cj_cost_price, 
        image_url, 
        images_json,
        video_url, 
        upload_mode,
        stock,
        created_at
      ) VALUES (?, 'dropship', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'both', ?, CURRENT_TIMESTAMP)
    `).bind(
      cjProductId,
      p.productNameEn || 'Global Product',
      fullDescription,
      retailPrice,
      priceSample,
      priceMinWhole,
      priceBulk,
      baseCost,
      mainImage,
      imagesList,
      videoUrl,
      p.inventory || 500
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: "প্রোডাক্ট সফলভাবে রিটেইল ও হোলসেল উভয় পেজের জন্য সেভ হয়েছে!",
      data: { title: p.productNameEn, retailPrice, priceSample, priceMinWhole, priceBulk }
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
