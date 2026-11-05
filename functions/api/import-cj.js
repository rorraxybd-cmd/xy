export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { cjProductId, retailMargin, shippingCushion, wholesaleMargin, previewOnly } = await request.json();

    if (!cjProductId) {
      return new Response(JSON.stringify({ success: false, error: "CJ Product ID is required" }), {
        headers: { "Content-Type": "application/json" },
        status: 400
      });
    }

    // ১. CJ Access Token সংগ্রহ
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

    // ৪. নির্ভুল মাল্টিপল ইমেজ এক্সট্রাকশন লজিক
    let rawImages = [];

    const extract = (source) => {
      if (!source) return;
      if (Array.isArray(source)) {
        source.forEach(item => {
          if (typeof item === 'string') {
            rawImages.push(item);
          } else if (item && typeof item === 'object') {
            rawImages.push(item.imageUrl || item.url || item.imgUrl || item.path || item.variantImage);
          }
        });
      } else if (typeof source === 'string') {
        if (source.includes(',')) {
          rawImages.push(...source.split(',').map(s => s.trim()));
        } else {
          rawImages.push(source.trim());
        }
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
    
    if (p.variants && Array.isArray(p.variants)) {
      p.variants.forEach(v => {
        if (v.variantImage) rawImages.push(v.variantImage);
      });
    }

    let imagesArray = rawImages.filter(img => {
      if (!img || typeof img !== 'string') return false;
      let clean = img.trim();
      return clean.startsWith('http') && 
             !clean.includes('rorraxy') && 
             !clean.includes('placeholder');
    });

    imagesArray = [...new Set(imagesArray)];

    if (imagesArray.length === 0 && p.productImage && p.productImage.startsWith('http')) {
      imagesArray = [p.productImage];
    }

    const mainImage = imagesArray.length > 0 ? imagesArray[0] : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30';
    const imagesListJson = JSON.stringify(imagesArray);
    
    // সাইজ বা ভ্যারিয়েন্ট এক্সট্রাক্ট করা
    let sizesList = [];
    if (p.variants && Array.isArray(p.variants)) {
      p.variants.forEach(v => {
        if (v.variantName) sizesList.push(v.variantName);
        else if (v.size) sizesList.push(v.size);
      });
    }
    sizesList = [...new Set(sizesList)];

    // ৫. ভিডিও গ্যালারি এবং সকল সোর্স থেকে ভিডিও লিংক নিখুঁতভাবে এক্সট্রাক্ট করার লজিক
    let videoUrl = '';
    
    if (p.materialVideo) videoUrl = p.materialVideo;
    else if (p.productVideo) videoUrl = p.productVideo;
    else if (p.video) videoUrl = p.video;
    else if (p.videoUrl) videoUrl = p.videoUrl;
    else if (p.vedio) videoUrl = p.vedio;
    
    if (!videoUrl && p.videos) {
      if (Array.isArray(p.videos) && p.videos.length > 0) {
        let vItem = p.videos[0];
        videoUrl = typeof vItem === 'string' ? vItem : (vItem.url || vItem.videoUrl || vItem.path || '');
      } else if (typeof p.videos === 'string') {
        videoUrl = p.videos;
      }
    }

    if (!videoUrl && p.materialVideoList) {
      if (Array.isArray(p.materialVideoList) && p.materialVideoList.length > 0) {
        let vItem = p.materialVideoList[0];
        videoUrl = typeof vItem === 'string' ? vItem : (vItem.url || vItem.videoUrl || vItem.path || '');
      }
    }
    
    if (!videoUrl && p.productVo && p.productVo.productVideo) {
      videoUrl = p.productVo.productVideo;
    }

    if (!videoUrl) {
      try {
        let jsonStr = JSON.stringify(p);
        let urlRegex = /https?:\/\/[^\s"'<>]+?\.(?:mp4|webm|ogg|mov)/gi;
        let matches = jsonStr.match(urlRegex);
        if (matches && matches.length > 0) {
          videoUrl = matches[0];
        }
      } catch (e) {}
    }

    // ৬. ডেসক্রিপশন পরিষ্কার ও সুন্দরভাবে ফরম্যাট করা
    let rawDesc = p.description || p.productNameEn || 'High-grade global product.';
    let cleanDescription = rawDesc
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/td>/gi, ' : ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    if (sizesList.length > 0) {
      cleanDescription = `AVAILABLE SIZES / OPTIONS:\n${sizesList.join(', ')}\n\n------------------------------------\n\n` + cleanDescription;
    }

    // প্রিভিউ মোডের জন্য রেসপন্স
    if (previewOnly) {
      return new Response(JSON.stringify({ 
        success: true, 
        data: { 
          title: p.productNameEn || 'Global Product', 
          retailPrice, 
          priceSample, 
          imagesCount: imagesArray.length,
          imagesArray: imagesArray,
          sizes: sizesList,
          videoUrl: videoUrl
        }
      }), { headers: { "Content-Type": "application/json" } });
    }

    // ৭. Save to D1 Database (সকল ইমেজ JSON ও ভিডিও সহ সেভ)
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
        imagesArray: imagesArray,
        videoUrl: videoUrl,
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
