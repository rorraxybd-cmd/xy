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

    // ৪. লোগো বা অপ্রাসঙ্গিক ইমেজ ফিল্টার করে শুধুমাত্র আসল প্রোডাক্টের গ্যালারি ছবি তোলার লজিক
    let rawImages = [];
    if (Array.isArray(p.productImageList)) {
      rawImages = p.productImageList;
    } else if (p.productImage) {
      rawImages = [p.productImage];
    } else if (p.bigImage) {
      rawImages = [p.bigImage];
    }

    // লোগো বা rorraxy সংবলিত লিংকগুলো গ্যালারি থেকে বাদ দেওয়ার ফিল্টার
    let imagesArray = rawImages.filter(img => img && typeof img === 'string' && !img.includes('rorraxy') && img.startsWith('http'));

    // যদি ফিল্টার করার পর কোনো ছবি না থাকে, তবে ফলব্যাক হিসেবে মূল ছবি রাখা
    if (imagesArray.length === 0 && p.productImage && !p.productImage.includes('rorraxy')) {
      imagesArray = [p.productImage];
    }

    const mainImage = imagesArray.length > 0 ? imagesArray[0] : '';
    const imagesListJson = JSON.stringify(imagesArray);
    const videoUrl = p.productVideo || '';

    // ৫. ডেসক্রিপশনের এইচটিএমএল ট্যাগগুলো নিখুঁতভাবে ক্লিন করা
    let rawDesc = p.description || p.productNameEn || 'High-grade global product.';
    const cleanDescription = rawDesc
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<\/p>/gi, '\n')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<[^>]+>/g, '') // সমস্ত এইচটিএমএল ট্যাগ রিমোভ
      .trim();

    // ৬. Save to D1 Database
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
      cleanDescription,
      retailPrice,
      priceSample,
      priceMinWhole,
      priceBulk,
      baseCost,
      mainImage,
      imagesListJson,
      videoUrl,
      p.inventory || 500
    ).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: "প্রোডাক্টের সমস্ত গ্যালারি ইমেজ ও ক্লিন ডেসক্রিপশন সফলভাবে সেভ হয়েছে!",
      data: { title: p.productNameEn, retailPrice, priceSample, imagesCount: imagesArray.length }
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
