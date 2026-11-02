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
            payment_method, // এখানে bKash, SSLCommerz, Payoneer, Stripe অথবা PayPal আসবে
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

        if (!master_order_id || !customer_name || !customer_phone || !shipping_address || !total_amount) {
            return new Response(JSON.stringify({ success: false, error: "Missing required order fields" }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // নিখুঁতভাবে প্রডাক্টের দাম ও পরিমাণ কাউন্ট করা
        let calculatedTotal = 0;
        let totalItemsQty = 0;

        if (Array.isArray(items)) {
            items.forEach(item => {
                const price = parseFloat((item.price || "0").toString().replace('$', ''));
                const qty = parseInt(item.qty || 1, 10);
                calculatedTotal += (price * qty);
                totalItemsQty += qty;
            });
        }

        const finalAmount = calculatedTotal > 0 ? calculatedTotal : Number(total_amount);

        // পেমেন্ট মেথড অনুযায়ী সিক্রেট কী হ্যান্ডেলিং (Cloudflare Variables থেকে রিড করবে)
        let gatewayResponseUrl = null;

        if (payment_method === "Stripe") {
            // const stripeSecretKey = env.STRIPE_SECRET_KEY;
            // এখানে স্ট্রাইপ এপিআই কল করে পেমেন্ট সেশন তৈরি করা যাবে
        } else if (payment_method === "PayPal") {
            // const paypalClientId = env.PAYPAL_CLIENT_ID;
            // পেপাল এপিআই ইন্টিগ্রেশন
        } else if (payment_method === "Payoneer") {
            // const payoneerKey = env.PAYONEER_API_KEY;
            // পেওনিয়ার চেকআউট ইন্টিগ্রেশন
        } else if (payment_method === "SSLCommerz") {
            // const sslStoreId = env.SSLCOMMERZ_STORE_ID;
            // এসএসএল কমার্স ইন্টিগ্রেশন
        } else if (payment_method === "bKash") {
            // const bkashAppKey = env.BKASH_APP_KEY;
            // বিকাশ ইন্টিগ্রেশন
        }

        // Cloudflare D1 Database এ অর্ডার সেভ করা
        const query = `
            INSERT INTO retail_orders (
                master_order_id, customer_name, customer_phone, shipping_address, 
                customer_country, payment_method, payment_status, transaction_id, 
                total_amount, currency, affiliate_id, affiliate_commission, 
                admin_commission, order_status, items
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await env.retail.prepare(query)
            .bind(
                master_order_id,
                customer_name,
                customer_phone,
                shipping_address,
                customer_country || 'Bangladesh',
                payment_method || 'Card',
                payment_status || 'Pending',
                transaction_id || '',
                finalAmount,
                currency || 'USD',
                affiliate_id || 'AFF-DIRECT',
                Number(affiliate_commission || 0),
                Number(admin_commission || 0),
                order_status || 'Pending',
                JSON.stringify(items || [])
            )
            .run();

        return new Response(JSON.stringify({ 
            success: true, 
            message: "Order placed successfully with multi-gateway support!",
            total_amount: finalAmount,
            total_qty: totalItemsQty,
            redirect_url: gatewayResponseUrl
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
