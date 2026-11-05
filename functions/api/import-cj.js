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

    // ৪. মাল্টিপল গ্যালারি ইমেজ নিখুঁতভাবে এক্সট্রাক্ট করার শক্তিশালী লজিক
    let rawImages = [];
    
    // productImageList যদি অ্যারে হয় (তাতে অবজেক্ট বা স্ট্রিং যাই থাকুক না কেন)
    if (Array.isArray(p.productImageList)) {
      p.productImageList.forEach(img => {
        if (typeof img === 'string') rawImages.push(img);
        else if (img && typeof img === 'object') {
          rawImages.push(img.imageUrl || img.url || img.imgUrl || img.path);
        }
      });
    } else if (typeof p.productImageList === 'string') {
      try { 
        let parsed = JSON.parse(p.productImageList);
        if (Array.isArray(parsed)) {
          parsed.forEach(img => {
            if (typeof img === 'string') rawImages.push(img);
            else if (img && typeof img === 'object') rawImages.push(img.imageUrl || img.url || img.imgUrl);
          });
        }
      } catch(e) { rawImages = [p.productImageList]; }
    }

    if (Array.isArray(p.productImages)) {
      p.productImages.forEach(img => {
        if (typeof img === 'string') rawImages.push(img);
      });
    }

    // সিঙ্গেল ইমেজ ফিল্ডগুলো ব্যাকআপ হিসেবে যুক্ত করা
    if (p.productImage) rawImages.push(p.productImage);
    if (p.bigImage) rawImages.push(p.bigImage);
    if (p.imageUrl) rawImages.push(p.imageUrl);

    // লোগো বা rorraxy ফিল্টার করে শুধুমাত্র আসল প্রোডাক্টের ছবিগুলো রাখা
    let imagesArray = rawImages.filter(img => {
      if (!img || typeof img !== 'string') return false;
      let clean = img.trim();
      return clean.startsWith('http') && !clean.includes('rorraxy');
    });

    imagesArray = [...new Set(imagesArray)]; // ডুপ্লিকেট দূর করা

    if (imagesArray.length === 0) {
      imagesArray = ['https://pub-508ef1e45bab487aadde85a1dba202c4.r2.dev/rorraxyfree/placeholder.png'];
    }

    const mainImage = imagesArray[0];
    const imagesListJson = JSON.stringify(imagesArray);
    
    // ভিডিও লিংক ফেচ করা
    const videoUrl = p.productVideo || p.video || p.videoUrl || p.materialVideo || '';

    // ৫. ডেসক্রিপশন সুন্দর প্যারাগ্রাফ আকারে সাজানোর লজিক
    let rawDesc = p.description || p.productNameEn || 'High-grade global product.';
    const cleanDescription = rawDesc
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/td>/gi, ' : ')
      .replace(/<[^>]+>/g, '') // সব এইচটিএমএল ট্যাগ রিমোভ
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n'); // সুন্দর গোছানো প্যারাগ্রাফ লাইন তৈরি

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
      message: "প্রোডাক্টের সমস্ত গ্যালারি ইমেজ, ভিডিও এবং গোছানো ডেসক্রিপশন সফলভাবে সেভ হয়েছে!",
      data: { 
        title: p.productNameEn, 
        retailPrice, 
        priceSample, 
        imagesCount: imagesArray.length,
        hasVideo: !!videoUrl 
      }
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
