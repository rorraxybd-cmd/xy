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
      return new Response(JSON.stringify({ success: false, error: "Missing required retail order fields or items" }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Group items by seller
    const sellerGroups = {};
    items.forEach(item => {
      const sellerId = item.sellerId || item.seller_id || 'RRX-MAIN-SELLER';
      if (!sellerGroups[sellerId]) {
        sellerGroups[sellerId] = [];
      }
      sellerGroups[sellerId].push(item);
    });

    const insertedSubOrders = [];
    const db = env.retail;

    for (const [sellerId, sellerItems] of Object.entries(sellerGroups)) {
      const subOrderId = master_order_id + '-' + sellerId.substring(0, 6).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);

      let subOrderTotal = 0;
      let combinedCustomNotes = []; // নোট একত্রিত করার জন্য অ্যারে

      sellerItems.forEach(item => {
        const price = parseFloat((item.price || "0").toString().replace('$', ''));
        const qty = parseInt(item.qty || 1, 10);
        subOrderTotal += (price * qty);

        // কাস্টম নোট এক্সট্রাক্ট করা
        const noteText = (item.custom_note || item.note || '').toString().trim();
        if (noteText) {
            // যদি একাধিক প্রোডাক্ট থাকে তবে প্রোডাক্টের নামসহ নোট দেখাবে
            if (sellerItems.length > 1) {
                combinedCustomNotes.push(`[${item.title || 'Item'}]: ${noteText}`);
            } else {
                combinedCustomNotes.push(noteText);
            }
        }
      });

      // নোটগুলোকে একটি স্ট্রিং-এ রূপান্তর (নতুন লাইন দিয়ে আলাদা করা)
      const finalCustomNote = combinedCustomNotes.join('\n');

      const calculatedAffiliateComm = Number(affiliate_commission || 0);
      const calculatedAdminComm = Number(admin_commission || 0);

      // SQL Query-তে custom_note যুক্ত করা হয়েছে
      const query = `
        INSERT INTO retail_orders (
          master_order_id, sub_order_id, seller_id, customer_name, customer_phone,
          shipping_address, customer_country, payment_method, payment_status,
          transaction_id, total_amount, currency, affiliate_id,
          affiliate_commission, admin_commission, order_status, items,
          custom_note
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.prepare(query)
        .bind(
          master_order_id,
          subOrderId,
          sellerId,
          customer_name,
          customer_phone,
          shipping_address,
          customer_country || 'Bangladesh',
          payment_method || 'Credit / Debit Card',
          payment_status || (payment_method === 'Cash on Delivery' ? 'Pending' : 'Paid'),
          transaction_id || '',
          subOrderTotal,
          currency || 'USD',
          affiliate_id || 'AFF-DIRECT',
          calculatedAffiliateComm,
          calculatedAdminComm,
          order_status || 'Pending',
          JSON.stringify(sellerItems),
          finalCustomNote // <- এখানে কাস্টম নোট বাইন্ড করা হলো
        )
        .run();

      insertedSubOrders.push({
        sub_order_id: subOrderId,
        seller_id: sellerId,
        amount: subOrderTotal
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Retail orders successfully placed and separated by sellers!",
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
