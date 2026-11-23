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

    // ফ্রন্টএন্ড থেকে নতুন ডাটাগুলো রিসিভ করা হচ্ছে
    const {
      master_order_id, order_id, customer_name, customer_phone, shipping_address,
      customer_country, payment_method, payment_status, transaction_id,
      total_amount, currency, order_status, items,
      affiliate_ref, commission_rate, platform, has_affiliate
    } = data;

    if (!master_order_id || !customer_name || !customer_phone || !shipping_address || !items || !Array.isArray(items)) {
      return new Response(JSON.stringify({ success: false, error: "Missing required retail order fields or items" }), {
        status: 400, headers: corsHeaders
      });
    }

    // প্রোডাক্টগুলো সেলার অনুযায়ী গ্রুপ করা
    const sellerGroups = {};
    items.forEach(item => {
      const sellerId = item.sellerId || item.seller_id || 'RRX-MAIN-SELLER';
      if (!sellerGroups[sellerId]) sellerGroups[sellerId] = [];
      sellerGroups[sellerId].push(item);
    });

    const insertedSubOrders = [];
    const db = env.retail;

    for (const [sellerId, sellerItems] of Object.entries(sellerGroups)) {
      const subOrderId = master_order_id + '-' + sellerId.substring(0, 6).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
      let subOrderTotal = 0;
      let combinedCustomNotes = [];

      sellerItems.forEach(item => {
        const price = parseFloat((item.price || "0").toString().replace('$', ''));
        const qty = parseInt(item.qty || 1, 10);
        subOrderTotal += (price * qty);
        const noteText = (item.custom_note || item.note || '').toString().trim();
        if (noteText) {
            combinedCustomNotes.push(sellerItems.length > 1 ? `[${item.title || 'Item'}]: ${noteText}` : noteText);
        }
      });

      const finalCustomNote = combinedCustomNotes.join('\n');

      // ব্যাকএন্ডে কমিশন ক্যালকুলেশন (সিকিউর)
      let calculatedAffiliateComm = 0;
      if (has_affiliate && affiliate_ref && commission_rate) {
          calculatedAffiliateComm = subOrderTotal * (parseFloat(commission_rate) / 100);
      }
      let calculatedAdminComm = subOrderTotal - calculatedAffiliateComm; 

      const query = `
        INSERT INTO retail_orders (
          master_order_id, sub_order_id, seller_id, customer_name, customer_phone,
          shipping_address, customer_country, payment_method, payment_status,
          transaction_id, total_amount, currency, affiliate_id,
          affiliate_commission, admin_commission, order_status, items,
          custom_note, commission_rate, platform
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.prepare(query)
        .bind(
          master_order_id, subOrderId, sellerId, customer_name, customer_phone,
          shipping_address, customer_country || 'Bangladesh',
          payment_method || 'Credit / Debit Card',
          payment_status || 'Paid', transaction_id || '',
          subOrderTotal, currency || 'USD',
          affiliate_ref || 'rorraxy-store',
          calculatedAffiliateComm, calculatedAdminComm,
          order_status || 'Pending',
          JSON.stringify(sellerItems),
          finalCustomNote,
          commission_rate || 0,
          platform || 'retail'
        ).run();

      insertedSubOrders.push({ sub_order_id: subOrderId, seller_id: sellerId, amount: subOrderTotal });
    }

    // অ্যাফিলিয়েটের ব্যালেন্স আপডেট করা (যদি অ্যাফিলিয়েট লিংক থাকে)
    if (has_affiliate && affiliate_ref && affiliate_ref !== 'rorraxy-store') {
        let totalAffiliateComm = 0;
        insertedSubOrders.forEach(order => {
            totalAffiliateComm += (order.amount * (parseFloat(commission_rate || 0) / 100));
        });

        if (totalAffiliateComm > 0) {
            await db.prepare(`
                UPDATE rorraxy_affiliates_master 
                SET total_earnings = COALESCE(total_earnings, 0) + ?,
                    available_balance = COALESCE(available_balance, 0) + ?,
                    total_referrals = COALESCE(total_referrals, 0) + 1
                WHERE unique_affiliate_id = ?
            `).bind(totalAffiliateComm, totalAffiliateComm, affiliate_ref).run();
        }
    }

    return new Response(JSON.stringify({
      success: true, message: "Retail orders successfully placed!",
      master_order_id: master_order_id, sub_orders: insertedSubOrders
    }), { status: 200, headers: corsHeaders });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers: corsHeaders });
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
