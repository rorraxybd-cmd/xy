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
            sellerItems.forEach(item => {
                const price = parseFloat((item.price || "0").toString().replace('$', ''));
                const qty = parseInt(item.qty || 1, 10);
                subOrderTotal += (price * qty);
            });

            const query = `
                INSERT INTO wholesale_orders (
                    master_order_id, sub_order_id, seller_id, buyer_company_name, customer_name, customer_phone, 
                    shipping_address, customer_country, payment_method, payment_status, 
                    transaction_id, total_amount, currency, affiliate_id, 
                    affiliate_commission, admin_commission, order_status, items
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
                    affiliate_id || 'AFF-DIRECT',
                    Number(affiliate_commission || 0),
                    Number(admin_commission || 0),
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
