export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { cjProductId, retailMargin, shippingCushion, wholesaleMargin, previewOnly, manualVideoUrl } = await request.json();

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

    // ৫. ভিডিও গ্যালারি এক্সট্রাকশন লজিক
    let videoUrl = (manualVideoUrl && typeof manualVideoUrl === 'string') ? manualVideoUrl.trim() : '';
    
    if (!videoUrl) {
      const directVideoFields = [
        p.materialVideo, p.productVideo, p.video, p.videoUrl, p.vedio,
        p.goodsVideo, p.itemVideo, p.mediaVideo, p.mp4Url, p.watchVideo
      ];
      for (let field of directVideoFields) {
        if (field && typeof field === 'string' && field.trim().startsWith('http')) {
          videoUrl = field.trim();
          break;
        }
      }
    }

    if (!videoUrl) {
      const videoSources = [p.videos, p.videoList, p.materialVideoList, p.productVideoList];
      for (let src of videoSources) {
        if (Array.isArray(src) && src.length > 0) {
          let firstVid = src[0];
          if (typeof firstVid === 'string' && firstVid.startsWith('http')) {
            videoUrl = firstVid.trim();
            break;
          } else if (firstVid && typeof firstVid === 'object') {
            videoUrl = (firstVid.url || firstVid.videoUrl || firstVid.path || firstVid.videoPath || '').trim();
            if (videoUrl) break;
          }
        }
      }
    }

    if (!videoUrl && p.productVo && typeof p.productVo === 'object') {
      let voVid = p.productVo.productVideo || p.productVo.video || p.productVo.videoUrl;
      if (voVid && typeof voVid === 'string' && voVid.startsWith('http')) {
        videoUrl = voVid.trim();
      }
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

    // ৬. ডেসক্রিপশন পরিষ্কার করার লজিক
    let rawDesc = p.description || p.productNameEn || 'High-grade global product.';
    let cleanDescription = rawDesc
      .replace(/<img[^>]*>/gi, '')
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
      .replace(/Packing list:[\s\S]*$/gi, '')
      .replace(/Package list:[\s\S]*$/gi, '')
      .replace(/Product Image:/gi, '')
      .replace(/\s\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();

    let productTitle = p.productNameEn || 'Global Product';
    let materialInfo = p.material || p.productMaterial || 'Standard Material';
    let sizesText = sizesList.length > 0 ? sizesList.join(', ') : 'Standard / Free Size';

    let structuredHeader = `PRODUCT OVERVIEW:\n` +
      `• Title: ${productTitle}\n` +
      `• Available Sizes: ${sizesText}\n` +
      `• Material: ${materialInfo}\n\n` +
      `------------------------------------\n\n`;

    cleanDescription = structuredHeader + cleanDescription;

    if (previewOnly) {
      return new Response(JSON.stringify({ 
        success: true, 
        data: { 
          title: productTitle, 
          retailPrice, 
          priceSample, 
          imagesCount: imagesArray.length,
          imagesArray: imagesArray,
          sizes: sizesList,
          material: materialInfo,
          videoUrl: videoUrl
        }
      }), { headers: { "Content-Type": "application/json" } });
    }

    // ৭. Save to D1 Database[cite: 5]
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
      productTitle,
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
      message: "প্রোডাক্টের সমস্ত গ্যালারি ইমেজ, ভিডিও এবং গোছানো ডেসক্রিপশন সফলভাবে সেভ হয়েছে!",[cite: 5]
      data: { 
        title: productTitle, 
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
```[cite: 5]

---

### ২. ফ্রন্টএন্ড ফাইল: `import.html`
প্রয়োজন সাপেক্ষে ফ্রন্টএন্ড ফাইলটি নিচের মতো পরিষ্কার ও গোছানো থাকবে:

```html
<!-- Global Product Importer - Full Screen Soft Dark Design -->
<div class="cj-fullscreen-wrapper">
  <div class="cj-content-container">
    <div class="cj-import-header">
      <h2>GLOBAL PRODUCT IMPORTER</h2>
    </div>
    
    <form id="cjImportForm">
      
      <!-- সিজে প্রোডাক্ট লিংক ইনপুট -->
      <div class="cj-form-group">
        <label for="cjProductUrl">CJ PRODUCT LINK (URL)</label>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="cjProductUrl" placeholder="PASTE CJ PRODUCT URL HERE..." style="flex: 1;">
          <button type="button" id="getPidBtn" onclick="extractPidFromUrl()" class="cj-btn-secondary">GET PID</button>
        </div>
      </div>

      <!-- প্রোডাক্ট আইডি বক্স -->
      <div class="cj-form-group" style="display: flex; gap: 8px; align-items: flex-end;">
        <div style="flex: 1;">
          <label for="cjProductId">CJ PRODUCT ID (PID)</label>
          <input type="text" id="cjProductId" placeholder="e.g. 1379254578851221504" required style="text-transform: none;">
        </div>
        <button type="button" id="previewBtn" onclick="fetchProductPreview()" class="cj-btn-secondary" style="height: 41px; background: rgba(212, 175, 55, 0.25); color: var(--gold-solid);">PREVIEW</button>
      </div>

      <!-- ম্যানুয়াল ভিডিও লিংক ইনপুট বক্স -->
      <div class="cj-form-group">
        <label for="manualVideoUrl">GALLERY VIDEO URL</label>
        <input type="text" id="manualVideoUrl" placeholder="PASTE DIRECT VIDEO MP4 LINK..." style="text-transform: none;">
      </div>

      <!-- লাইভ থাম্বনেইল প্রিভিউ বক্স -->
      <div id="productPreviewBox" style="display: none; background: #040406; border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 12px; padding: 12px; margin-bottom: 14px;">
        <div style="font-size: 0.68rem; font-weight: 700; color: var(--gold-solid); margin-bottom: 6px; text-transform: uppercase;">Product Preview</div>
        <div id="previewTitle" style="font-size: 0.72rem; color: var(--text-white); font-weight: 600; margin-bottom: 8px; line-height: 1.3;"></div>
        <div id="previewPrice" style="font-size: 0.65rem; color: var(--text-gray); margin-bottom: 8px;"></div>
        
        <!-- সাইজ ও ভ্যারিয়েন্ট ইনফো -->
        <div id="previewSizes" style="font-size: 0.62rem; color: #00ff80; margin-bottom: 8px; font-weight: 600;"></div>

        <!-- ছোট ছোট থাম্বনেইল গ্যালারি -->
        <div style="font-size: 0.62rem; font-weight: 700; color: var(--text-gray); margin-bottom: 4px;">GALLERY IMAGES:</div>
        <div id="previewImagesGrid" style="display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; max-height: 75px;"></div>
        
        <!-- ভিডিও প্রিভিউ সেকশন -->
        <div id="previewVideoContainer" style="margin-top: 8px;"></div>
      </div>

      <div class="cj-form-row">
        <div class="cj-form-group">
          <label for="retailMargin">RETAIL MARGIN (%)</label>
          <input type="number" id="retailMargin" value="70" placeholder="70" required>
        </div>

        <div class="cj-form-group">
          <label for="shippingCushion">SHIPPING CUSHION ($)</label>
          <input type="number" step="0.1" id="shippingCushion" value="6.00" placeholder="6.00" required>
        </div>
      </div>

      <div class="cj-form-group">
        <label for="wholesaleMargin">WHOLESALE MARGIN (%)</label>
        <input type="number" id="wholesaleMargin" value="25" placeholder="25" required>
      </div>

      <div style="display: flex; justify-content: center; margin-top: 10px;">
        <button type="submit" id="importBtn" class="cj-btn-gold">
          <span>SYNC & IMPORT</span>
        </button>
      </div>
    </form>

    <div id="importStatus" class="cj-status-box"></div>
  </div>
</div>

<style>
  :root {
    --bg-pure: #000000;
    --card-soft: #0c0c12;
    --gold-gradient: linear-gradient(135deg, #bf953f 0%, #fcf6ba 25%, #b38728 50%, #fbf5b7 75%, #aa771c 100%);
    --gold-solid: #d4af37;
    --pink-love: #ff2a85;
    --text-white: #ffffff;
    --text-gray: #a0a0b5;
    --font-main: 'Poppins', sans-serif;
  }

  html, body {
    width: 100%; max-width: 100%; overflow-x: hidden;
    background: var(--bg-pure) !important; color: var(--text-white);
    font-family: var(--font-main); margin: 0; padding: 0;
    -webkit-font-smoothing: antialiased;
  }

  .cj-fullscreen-wrapper {
    width: 100%; min-height: 100vh; background-color: var(--bg-pure);
    display: flex; align-items: center; justify-content: center;
    box-sizing: border-box; padding: 12px;
  }

  .cj-content-container {
    width: 100%; max-width: 520px; padding: 24px 20px;
    background-color: var(--card-soft); box-sizing: border-box;
    border-radius: 16px; border: none;
    box-shadow: 0 10px 30px rgba(0,0,0,0.9), 0 0 15px rgba(212, 175, 55, 0.08);
  }

  .cj-import-header { margin-bottom: 20px; text-align: center; }
  .cj-import-header h2 {
    font-size: 1.05rem; font-weight: 800; margin: 0;
    background: var(--gold-gradient); -webkit-background-clip: text;
    -webkit-text-fill-color: transparent; letter-spacing: 1px;
    text-transform: uppercase;
  }

  .cj-form-row { display: flex; gap: 12px; width: 100%; }
  .cj-form-row .cj-form-group { flex: 1; min-width: 0; }
  .cj-form-group { margin-bottom: 14px; width: 100%; }

  .cj-form-group label {
    display: block; font-size: 0.62rem; font-weight: 700;
    color: var(--text-white); margin-bottom: 5px; letter-spacing: 0.5px;
  }

  .cj-form-group input {
    width: 100%; padding: 11px 14px; background: #040406;
    border: none; border-radius: 10px;
    color: var(--text-white); font-size: 0.8rem; outline: none;
    box-sizing: border-box; font-family: var(--font-main);
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
  }

  .cj-form-group input:focus {
    box-shadow: 0 0 10px rgba(212, 175, 55, 0.2), inset 0 1px 3px rgba(0,0,0,0.5);
  }

  .cj-btn-secondary {
    background: rgba(212, 175, 55, 0.15); border: none; border-radius: 10px;
    color: var(--gold-solid); font-weight: 700; font-size: 0.7rem; padding: 0 14px;
    cursor: pointer; font-family: var(--font-main); flex-shrink: 0;
    transition: background 0.2s, color 0.2s;
  }
  .cj-btn-secondary.active-pink {
    background: var(--pink-love) !important;
    color: #ffffff !important;
  }

  .cj-btn-gold {
    width: 100%; max-width: 260px; padding: 11px 16px;
    background: var(--gold-gradient); border: none; border-radius: 20px;
    cursor: pointer; font-weight: 800; font-size: 0.74rem; color: #000000;
    text-transform: uppercase; letter-spacing: 0.8px;
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.25);
  }

  .cj-status-box {
    margin-top: 16px; font-size: 0.72rem; line-height: 1.5;
    border-radius: 10px; display: none; padding: 12px;
    text-transform: none !important; background: #040406;
  }
</style>

<script>
  function extractPidFromUrl() {
    let urlInput = document.getElementById('cjProductUrl');
    let pidInput = document.getElementById('cjProductId');
    let getPidBtn = document.getElementById('getPidBtn');
    let val = urlInput.value.trim();
    
    if (!val) {
      alert("Please paste the CJ product link first.");
      return;
    }

    getPidBtn.classList.add('active-pink');

    try {
      if (/^[0-9a-zA-Z]{15,}$/.test(val)) {
        pidInput.value = val;
        urlInput.value = "";
      } else {
        let pidMatch = val.match(/pid=([0-9a-zA-Z]{15,})/) || 
                       val.match(/(?:productDetails|detail|product-detail)\/([0-9a-zA-Z]{15,})/) ||
                       val.match(/([0-9a-zA-Z]{15,})/);
        
        if (pidMatch && pidMatch[1]) {
          pidInput.value = pidMatch[1];
          urlInput.value = "";
        } else {
          let cleanUrl = val.split('?')[0].split('#')[0];
          let segments = cleanUrl.split('/').filter(Boolean);
          let possibleId = segments[segments.length - 1];
          if (possibleId && possibleId.length >= 12) {
            pidInput.value = possibleId;
            urlInput.value = "";
          } else {
            alert("Valid product ID or link not found.");
          }
        }
      }
    } catch(e) {
      alert("Error extracting ID from link.");
    }

    setTimeout(() => {
      getPidBtn.classList.remove('active-pink');
    }, 1000);
  }

  async function fetchProductPreview() {
    let cjProductId = document.getElementById('cjProductId').value.trim();
    if (!cjProductId) {
      alert("Please enter the Product ID (PID) first.");
      return;
    }

    const previewBox = document.getElementById('productPreviewBox');
    const previewTitle = document.getElementById('previewTitle');
    const previewPrice = document.getElementById('previewPrice');
    const previewSizes = document.getElementById('previewSizes');
    const previewImagesGrid = document.getElementById('previewImagesGrid');
    const previewVideoContainer = document.getElementById('previewVideoContainer');
    const previewBtn = document.getElementById('previewBtn');

    previewBox.style.display = 'block';
    previewTitle.innerHTML = 'Loading product details from CJ...';
    previewPrice.innerHTML = '';
    previewSizes.innerHTML = '';
    previewImagesGrid.innerHTML = '';
    previewVideoContainer.innerHTML = '';
    previewBtn.disabled = true;

    try {
      const res = await fetch('/api/import-cj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cjProductId, 
          retailMargin: document.getElementById('retailMargin').value, 
          shippingCushion: document.getElementById('shippingCushion').value, 
          wholesaleMargin: document.getElementById('wholesaleMargin').value,
          manualVideoUrl: document.getElementById('manualVideoUrl').value.trim(),
          previewOnly: true 
        })
      });
      
      const result = await res.json();

      if (result.success) {
        previewTitle.innerHTML = result.data.title;
        let imgCount = result.imagesArray ? result.imagesArray.length : (result.data.imagesCount || 0);
        previewPrice.innerHTML = `Retail Price: <strong>$${result.data.retailPrice}</strong> | Sample Price: <strong>$${result.data.priceSample}</strong> | Total Images: <strong>${imgCount}</strong>`;
        
        if (result.data.sizes && result.data.sizes.length > 0) {
          previewSizes.innerHTML = `Available Sizes / Variants: ${result.data.sizes.join(', ')}`;
        } else {
          previewSizes.innerHTML = `Available Sizes: Standard / Free Size`;
        }

        if (result.imagesArray && Array.isArray(result.imagesArray)) {
          result.imagesArray.forEach(imgUrl => {
            let img = document.createElement('img');
            img.src = imgUrl;
            img.style.width = '55px';
            img.style.height = '55px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '6px';
            img.style.border = '1px solid rgba(212, 175, 55, 0.3)';
            previewImagesGrid.appendChild(img);
          });
        }

        let activeVideo = result.data.videoUrl || document.getElementById('manualVideoUrl').value.trim();
        if (activeVideo) {
          let videoWrapper = document.createElement('div');
          videoWrapper.innerHTML = `
            <div style="font-size: 0.62rem; font-weight: 700; color: #00ff80; margin-bottom: 4px;">✓ GALLERY VIDEO AVAILABLE</div>
            <video src="${activeVideo}" controls autoplay muted style="width: 100%; max-height: 150px; border-radius: 6px; background: #000;"></video>
          `;
          previewVideoContainer.appendChild(videoWrapper);
        } else {
          let noVideoDiv = document.createElement('div');
          noVideoDiv.style.fontSize = '0.6rem';
          noVideoDiv.style.color = 'var(--text-gray)';
          noVideoDiv.textContent = 'No video available for this product.';
          previewVideoContainer.appendChild(noVideoDiv);
        }

      } else {
        previewTitle.innerHTML = `<span style="color: var(--pink-love);">Error: ${result.error}</span>`;
      }
    } catch (err) {
      previewTitle.innerHTML = `<span style="color: var(--pink-love);">Preview Failed: ${err.message}</span>`;
    } finally {
      previewBtn.disabled = false;
    }
  }

  document.getElementById('cjImportForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusDiv = document.getElementById('importStatus');
    const btn = document.getElementById('importBtn');
    
    let cjProductId = document.getElementById('cjProductId').value.trim();
    const retailMargin = document.getElementById('retailMargin').value.trim();
    const shippingCushion = document.getElementById('shippingCushion').value.trim();
    const wholesaleMargin = document.getElementById('wholesaleMargin').value.trim();
    const manualVideoUrl = document.getElementById('manualVideoUrl').value.trim();

    statusDiv.style.display = 'block';
    statusDiv.style.background = 'rgba(212, 175, 55, 0.08)';
    statusDiv.style.color = 'var(--gold-solid)';
    statusDiv.innerHTML = 'SYNCING PRODUCT DATA...';
    btn.disabled = true;

    try {
      const res = await fetch('/api/import-cj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cjProductId, 
          retailMargin, 
          shippingCushion, 
          wholesaleMargin,
          manualVideoUrl,
          fetchAllImages: true
        })
      });
      
      const result = await res.json();

      if (result.success) {
        statusDiv.style.background = 'rgba(0, 255, 128, 0.08)';
        statusDiv.style.color = '#00ff80';
        statusDiv.innerHTML = `✓ ${result.message}<br><br>
          <strong>Product:</strong> ${result.data.title}<br>
          <strong>Images Count:</strong> ${result.data.imagesCount || 0} Images Synced<br>
          <strong>Video Synced:</strong> ${result.data.hasVideo ? 'Yes (✓)' : 'No'}<br>
          <strong>Retail Price:</strong> $${result.data.retailPrice}<br>
          <strong>Sample Price:</strong> $${result.data.priceSample}`;
        document.getElementById('cjImportForm').reset();
        document.getElementById('productPreviewBox').style.display = 'none';
      } else {
        statusDiv.style.background = 'rgba(255, 42, 133, 0.08)';
        statusDiv.style.color = 'var(--pink-love)';
        statusDiv.innerHTML = `✕ ERROR: ${result.error}`;
      }
    } catch (err) {
      statusDiv.style.background = 'rgba(255, 42, 133, 0.08)';
      statusDiv.style.color = 'var(--pink-love)';
      statusDiv.innerHTML = `✕ CONNECTION FAILED: ${err.message}`;
    } finally {
      btn.disabled = false;
    }
  });
</script>
