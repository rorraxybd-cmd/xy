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

    // ৪. নির্ভুল ইমেজ এক্সট্রাকশন লজিক (লোগো বা রর্যাক্সি ফিল্টার করে বাদ দেওয়া)
    let rawImages = [];

    const extract = (source) => {
      if (!source) return;
      if (Array.isArray(source)) {
        source.forEach(item => {
          if (typeof item === 'string') rawImages.push(item);
          else if (item && typeof item === 'object') {
            rawImages.push(item.imageUrl || item.url || item.imgUrl || item.path);
          }
        });
      } else if (typeof source === 'string') {
        rawImages.push(...source.split(',').map(s => s.trim()));
      }
    };

    extract(p.productImageList);
    extract(p.productImages);
    extract(p.materialImageList);
    extract(p.carouselImage);
    extract(p.entryImageList);
    extract(p.productImage);
    extract(p.bigImage);
    extract(p.imageUrl);

    // কঠোরভাবে লোগো বা rorraxy যুক্ত লিংক ফিল্টার করে বাদ দেওয়া
    let imagesArray = rawImages.filter(img => {
      if (!img || typeof img !== 'string') return false;
      let clean = img.trim();
      return clean.startsWith('http') && 
             !clean.includes('rorraxy') && 
             !clean.includes('placeholder') &&
             (clean.endsWith('.jpg') || clean.endsWith('.png') || clean.endsWith('.jpeg') || clean.includes('cj') || clean.includes('product'));
    });

    imagesArray = [...new Set(imagesArray)]; // ডুপ্লিকেট দূর করা

    // যদি কোনো ছবি না পাওয়া যায়, তবে একটি নিরাপদ ডিফল্ট প্রোডাক্ট ইমেজ রাখা (লোগো নয়)
    if (imagesArray.length === 0) {
      imagesArray = [p.productImage && p.productImage.startsWith('http') ? p.productImage : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'];
    }

    const mainImage = imagesArray[0]; // লোগো ছাড়া একদম প্রথম আসল প্রোডাক্ট ইমেজ
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

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
}
