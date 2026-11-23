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

    // ✅ নতুন ডাটাগুলো রিসিভ করা হচ্ছে (affiliate_ref, commission_rate, platform, has_affiliate)
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
      affiliate_ref,
      commission_rate,
      platform,
      has_affiliate,
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
      const sellerId = item.seller_id || item.sellerId || 'RRX-WHOLESALE-SELLER';
      if (!sellerGroups[sellerId]) {
        sellerGroups[sellerId] = [];
      }
      sellerGroups[sellerId].push(item);
    });

    const insertedSubOrders = [];
    const db = env.retail; 
    let totalAffiliateCommToCredit = 0; // মোট কমিশন হিসাবের জন্য

    for (const [sellerId, sellerItems] of Object.entries(sellerGroups)) {
      const subOrderId = master_order_id + '-WS-' + sellerId.substring(0, 6).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
      
      let subOrderTotal = 0;
      const itemNotes = [];
      
      sellerItems.forEach(item => {
        const price = parseFloat((item.price || item.unit_price || "0").toString().replace('$', ''));
        const qty = parseInt(item.qty || item.quantity || 1, 10);
        subOrderTotal += (price * qty);

        const note = item.custom_note || item.size;
        if (note && note !== 'STANDARD BULK' && note !== 'STANDARD') {
          itemNotes.push(note.trim());
        }
      });

      const uniqueNotes = [...new Set(itemNotes)];
      const combinedCustomNote = uniqueNotes.length > 0 ? uniqueNotes.join(' | ') : 'STANDARD BULK';

      // ✅ ব্যাকএন্ডে নিরাপদে কমিশন ক্যালকুলেশন
      let calculatedAffiliateComm = 0;
      if (has_affiliate && affiliate_ref && affiliate_ref !== 'rorraxy-store') {
          calculatedAffiliateComm = subOrderTotal * (parseFloat(commission_rate || 0) / 100);
          totalAffiliateCommToCredit += calculatedAffiliateComm;
      }
      let calculatedAdminComm = subOrderTotal - calculatedAffiliateComm;

      // ✅ SQL কুয়েরিতে commission_rate এবং platform যুক্ত করা হলো
      const query = `
        INSERT INTO wholesale_orders (
          master_order_id, sub_order_id, seller_id, buyer_company_name, customer_name, customer_phone,
          shipping_address, customer_country, payment_method, payment_status,
          transaction_id, total_amount, currency, affiliate_id,
          affiliate_commission, admin_commission, order_status, items, custom_note,
          commission_rate, platform
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          affiliate_ref || 'rorraxy-store',
          calculatedAffiliateComm,
          calculatedAdminComm,
          order_status || 'Pending',
          JSON.stringify(sellerItems),
          combinedCustomNote,
          parseFloat(commission_rate || 0), // নতুন কলাম
          platform || 'wholesale'           // নতুন কলাম
        )
        .run();

      insertedSubOrders.push({
        sub_order_id: subOrderId,
        seller_id: sellerId,
        amount: subOrderTotal,
        custom_note: combinedCustomNote
      });
    }

    // ✅ অ্যাফিলিয়েটের ব্যালেন্স আপডেট করা (যদি অ্যাফিলিয়েট লিংক থাকে)
    if (has_affiliate && affiliate_ref && affiliate_ref !== 'rorraxy-store' && totalAffiliateCommToCredit > 0) {
        await db.prepare(`
            UPDATE rorraxy_affiliates_master 
            SET total_earnings = COALESCE(total_earnings, 0) + ?,
                available_balance = COALESCE(available_balance, 0) + ?,
                total_referrals = COALESCE(total_referrals, 0) + 1
            WHERE unique_affiliate_id = ?
        `).bind(totalAffiliateCommToCredit, totalAffiliateCommToCredit, affiliate_ref).run();
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
