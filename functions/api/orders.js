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

        // রিটেইল অর্ডার ভ্যালিডেশন
        if (!master_order_id || !customer_name || !customer_phone || !shipping_address || !items || !Array.isArray(items)) {
            return new Response(JSON.stringify({ success: false, error: "Missing required retail order fields or items" }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // সেলার অনুযায়ী প্রডাক্টগুলো আলাদা করা (Grouping items by seller_id)
        const sellerGroups = {};
        items.forEach(item => {
            const sellerId = item.sellerId || item.seller_id || 'RRX-MAIN-SELLER';
            if (!sellerGroups[sellerId]) {
                sellerGroups[sellerId] = [];
            }
            sellerGroups[sellerId].push(item);
        });

        const insertedSubOrders = [];
        const db = env.retail; // আপনার D1 ডাটাবেস বাইন্ডিং

        // প্রতিটি সেলারের জন্য আলাদা সাব-অর্ডার ও সেলার আইডি দিয়ে ডাটাবেসে ইনসার্ট করা
        for (const [sellerId, sellerItems] of Object.entries(sellerGroups)) {
            
            // সাব-অর্ডার আইডি এবং সেলার আইডি জেনারেশন
            const subOrderId = master_order_id + '-' + sellerId.substring(0, 6).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);

            // এই সেলারের আইটেমগুলোর মোট দাম হিসাব করা
            let subOrderTotal = 0;
            sellerItems.forEach(item => {
                const price = parseFloat((item.price || "0").toString().replace('$', ''));
                const qty = parseInt(item.qty || 1, 10);
                subOrderTotal += (price * qty);
            });

            // এফিলিয়েট ও এডমিন কমিশন ক্যালকুলেশন (প্রয়োজন অনুযায়ী অ্যাডজাস্ট করা যাবে)
            const calculatedAffiliateComm = Number(affiliate_commission || 0);
            const calculatedAdminComm = Number(admin_commission || 0);

            const query = `
                INSERT INTO retail_orders (
                    master_order_id, sub_order_id, seller_id, customer_name, customer_phone, 
                    shipping_address, customer_country, payment_method, payment_status, 
                    transaction_id, total_amount, currency, affiliate_id, 
                    affiliate_commission, admin_commission, order_status, items
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    JSON.stringify(sellerItems)
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
