export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  try {
    const { request, env } = context;
    const data = await request.json();

    const {
      master_order_id,
      buyer_company_name,
      customer_name,
      customer_phone,
      shipping_address,
      customer_country,
      payment_method,
      payment_status,
      transaction_id,
      total_amount,
      currency,
      affiliate_id,
      affiliate_commission,
      admin_commission,
      order_status,
      items
    } = data;

    if (!master_order_id || !customer_name || !customer_phone || !shipping_address || !items || !Array.isArray(items)) {
      return new Response(JSON.stringify({ success: false, error: "Missing required wholesale order fields" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // সেলার অনুযায়ী প্রোডাক্ট গ্রুপিং
    const sellerGroups = {};
    items.forEach(item => {
      const sellerId = item.sellerId || item.seller_id || 'RRX-WHOLESALE-SELLER';
      if (!sellerGroups[sellerId]) {
        sellerGroups[sellerId] = [];
      }
      sellerGroups[sellerId].push(item);
    });

    const insertedSubOrders = [];
    const db = env.retail; // আপনার D1 ডাটাবেস বাইন্ডিং

    for (const [sellerId, sellerItems] of Object.entries(sellerGroups)) {
      const subOrderId = master_order_id + '-WS-' + sellerId.substring(0, 6).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
      
      let subOrderTotal = 0;
      let fallbackAffiliateId = affiliate_id || 'AFF-DIRECT';

      // ✅ কাস্টম নোটগুলো একসাথে করা (যাতে DB-তে সেভ করা যায়)
      const itemNotes = [];
      
      sellerItems.forEach(item => {
        // প্রাইস ও কোয়ান্টিটি হিসাব
        const price = parseFloat((item.price || item.unit_price || "0").toString().replace('$', ''));
        const qty = parseInt(item.qty || item.quantity || 1, 10);
        subOrderTotal += (price * qty);

        // ✅ অ্যাফিলিয়েট আইডি চেক (আইটেমের ভেতরে থাকলে সেটাও ধরবে)
        if (item.affiliateId || item.affiliate_id) {
          fallbackAffiliateId = item.affiliateId || item.affiliate_id;
        }

        // ✅ কাস্টম নোট বা সাইজ কালেক্ট করা
        const note = item.custom_note || item.size;
        if (note && note !== 'STANDARD BULK' && note !== 'STANDARD') {
          itemNotes.push(note.trim());
        }
      });

      // ডুপ্লিকেট নোট বাদ দেওয়া এবং '|' দিয়ে জোড়া দেওয়া
      const uniqueNotes = [...new Set(itemNotes)];
      const combinedCustomNote = uniqueNotes.length > 0 ? uniqueNotes.join(' | ') : 'STANDARD BULK';

      // ✅ SQL কুয়েরিতে custom_note যুক্ত করা হয়েছে
      const query = `
        INSERT INTO wholesale_orders (
          master_order_id, sub_order_id, seller_id, buyer_company_name, customer_name, customer_phone,
          shipping_address, customer_country, payment_method, payment_status,
          transaction_id, total_amount, currency, affiliate_id,
          affiliate_commission, admin_commission, order_status, items, custom_note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.prepare(query)
        .bind(
          master_order_id,
          subOrderId,
          sellerId,
          buyer_company_name || 'Direct Wholesale Buyer',
          customer_name,
          customer_phone,
          shipping_address,
          customer_country || 'Bangladesh',
          payment_method || 'Bank Transfer',
          payment_status || 'Pending',
          transaction_id || '',
          subOrderTotal,
          currency || 'USD',
          fallbackAffiliateId,
          Number(affiliate_commission || 0),
          Number(admin_commission || 0),
          order_status || 'Pending',
          JSON.stringify(sellerItems), // পুরো আইটেম অবজেক্ট JSON হিসেবে সেভ
          combinedCustomNote          // ✅ নতুন কলামের ডাটা
        )
        .run();

      insertedSubOrders.push({
        sub_order_id: subOrderId,
        seller_id: sellerId,
        amount: subOrderTotal,
        custom_note: combinedCustomNote
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Wholesale orders successfully placed and separated by sellers!",
      master_order_id: master_order_id,
      sub_orders: insertedSubOrders
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
