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

    // ৪. সিজে এপিআই থেকে সমস্ত ছবি নিখুঁতভাবে বের করার চূড়ান্ত লজিক
    let rawImages = [];

    // যদি productImage কমা দিয়ে আলাদা করা স্ট্রিং বা অ্যারে হয়
    if (p.productImage) {
      if (typeof p.productImage === 'string') {
        // অনেক সময় সিজে কমা দিয়ে একাধিক ছবি দেয়
        let splitImgs = p.productImage.split(',').map(img => img.trim());
        rawImages.push(...splitImgs);
      } else if (Array.isArray(p.productImage)) {
        rawImages.push(...p.productImage);
      }
    }

    // যদি productImageList বা অন্য কোনো প্রপার্টি থাকে
    if (p.productImageList) {
      if (Array.isArray(p.productImageList)) {
        p.productImageList.forEach(item => {
          if (typeof item === 'string') rawImages.push(item);
          else if (item && item.imageUrl) rawImages.push(item.imageUrl);
          else if (item && item.url) rawImages.push(item.url);
        });
      } else if (typeof p.productImageList === 'string') {
        rawImages.push(...p.productImageList.split(',').map(s => s.trim()));
      }
    }

    // অন্যান্য সম্ভাব্য ইমেজ ফিল্ড স্ক্যান করা
    ['materialImageList', 'carouselImage', 'entryImageList', 'productImages', 'bigImage', 'imageUrl'].forEach(field => {
      if (p[field]) {
        if (Array.isArray(p[field])) {
          p[field].forEach(it => {
            if (typeof it === 'string') rawImages.push(it);
            else if (it && (it.imageUrl || it.url)) rawImages.push(it.imageUrl || it.url);
          });
        } else if (typeof p[field] === 'string') {
          rawImages.push(...p[field].split(',').map(s => s.trim()));
        }
      }
    });

    // লোগো বা ভুল লিংক ফিল্টার করে শুধু আসল http লিংক রাখা
    let imagesArray = rawImages.filter(img => {
      if (!img || typeof img !== 'string') return false;
      let clean = img.trim();
      return clean.startsWith('http') && !clean.includes('rorraxy');
    });

    imagesArray = [...new Set(imagesArray)]; // ডুপ্লিকেট রিমোভ

    if (imagesArray.length === 0) {
      imagesArray = ['https://pub-508ef1e45bab487aadde85a1dba202c4.r2.dev/rorraxyfree/placeholder.png'];
    }

    const mainImage = imagesArray[0];
    const imagesListJson = JSON.stringify(imagesArray);
    
    // ভিডিও লিংক ফেচ করা
    const videoUrl = p.productVideo || p.video || p.videoUrl || p.materialVideo || '';

    // ৫. ডেসক্রিপশন গুছিয়ে নেওয়া
    let rawDesc = p.description || p.productNameEn || 'High-grade global product.';
    const cleanDescription = rawDesc
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/td>/gi, ' : ')
      .replace(/<[^>]+>/g, '')
      .replace(/\n\s*\n/g, '\n')
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
      message: "প্রোডাক্টের সমস্ত গ্যালারি ইমেজ, ভিডিও এবং গোছানো ডেসক্রিপশন সফলভাবে সেভ হয়েছে!",
      data: { 
        title: p.productNameEn, 
        retailPrice, 
        priceSample, 
        imagesCount: imagesArray.length,
        hasVideo: !!videoUrl 
      }
    }), { headers: { "Content-Type": "application/json" } });

  } cppatch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
