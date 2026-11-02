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
            store_owner_id,
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
            return new Response(JSON.stringify({ success: false, error: "Missing required dropshipping order fields" }), {
                status: 400,
                headers: corsHeaders
            });
        }

        const supplierGroups = {};
        items.forEach(item => {
            const supplierId = item.supplierId || item.supplier_id || 'RRX-DEFAULT-SUPPLIER';
            if (!supplierGroups[supplierId]) {
                supplierGroups[supplierId] = [];
            }
            supplierGroups[supplierId].push(item);
        });

        const insertedSubOrders = [];
        const db = env.retail; // আপনার D1 ডাটাবেস বাইন্ডিং

        for (const [supplierId, supplierItems] of Object.entries(supplierGroups)) {
            const subOrderId = master_order_id + '-DS-' + supplierId.substring(0, 6).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);

            let orderTotal = 0;
            let totalSupplierCost = 0;

            supplierItems.forEach(item => {
                const retailPrice = parseFloat((item.price || "0").toString().replace('$', ''));
                const supplierPrice = parseFloat((item.supplierCost || item.cost || "0").toString().replace('$', ''));
                const qty = parseInt(item.qty || 1, 10);
                
                orderTotal += (retailPrice * qty);
                totalSupplierCost += (supplierPrice * qty);
            });

            const netProfit = orderTotal - totalSupplierCost;

            const query = `
                INSERT INTO dropshipping_orders (
                    master_order_id, sub_order_id, supplier_id, store_owner_id, customer_name, 
                    customer_phone, shipping_address, customer_country, payment_method, 
                    payment_status, transaction_id, total_amount, supplier_cost, net_profit, 
                    currency, affiliate_id, affiliate_commission, admin_commission, order_status, items
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            await db.prepare(query)
                .bind(
                    master_order_id,
                    subOrderId,
                    supplierId,
                    store_owner_id || 'STORE-OWNER-MAIN',
                    customer_name,
                    customer_phone,
                    shipping_address,
                    customer_country || 'Bangladesh',
                    payment_method || 'Online Payment',
                    payment_status || 'Paid',
                    transaction_id || '',
                    orderTotal,
                    totalSupplierCost,
                    netProfit,
                    currency || 'USD',
                    affiliate_id || 'AFF-DIRECT',
                    Number(affiliate_commission || 0),
                    Number(admin_commission || 0),
                    order_status || 'Processing',
                    JSON.stringify(supplierItems)
                )
                .run();

            insertedSubOrders.push({
                sub_order_id: subOrderId,
                supplier_id: supplierId,
                total_amount: orderTotal,
                net_profit: netProfit
            });
        }

        return new Response(JSON.stringify({ 
            success: true, 
            message: "Dropshipping orders successfully processed and grouped by suppliers!",
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
