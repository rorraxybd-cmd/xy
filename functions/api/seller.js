// ক্লাউডফায়ার ওয়ার্কার্স ব্যাকএন্ড এপিআই হ্যান্ডলার উদাহরণ (Backend API Logic)
export async function onRequest(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const emailParam = url.searchParams.get('email');

    if (request.method === 'GET' && action === 'profile') {
        if (!emailParam) {
            return Response.json({ success: false, error: "Email is required" }, { status: 400 });
        }
        // নির্দিষ্ট ইমেইল দিয়ে ডেটাবেস থেকে কুয়েরি করা
        const { results } = await env.DB.prepare(
            "SELECT * FROM seller_profiles WHERE email = ?"
        ).bind(emailParam).all();

        return Response.json({ success: true, data: results });
    }

    if (request.method === 'POST' && action === 'profile') {
        const body = await request.json();
        const email = body.email;

        if (!email) {
            return Response.json({ success: false, error: "Email is missing" }, { status: 400 });
        }

        // ডেটাবেসে ইমেইল দিয়ে চেক করা আগে থেকে আছে কি না, থাকলে আপডেট আর না হলে ইনসার্ট (UPSERT)
        await env.DB.prepare(`
            INSERT INTO seller_profiles (seller_id, brand_name, full_name, business_desc, email, whatsapp, emergency_phone, country, full_address, doc_type, doc_number, default_payout_details, logo_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET
            brand_name = excluded.brand_name,
            full_name = excluded.full_name,
            business_desc = excluded.business_desc,
            whatsapp = excluded.whatsapp,
            emergency_phone = excluded.emergency_phone,
            country = excluded.country,
            full_address = excluded.full_address,
            doc_type = excluded.doc_type,
            doc_number = excluded.doc_number,
            default_payout_details = excluded.default_payout_details,
            logo_url = excluded.logo_url
        `).bind(
            email, // seller_id হিসেবে ইমেইল ব্যবহার করা হলো যাতে ইউনিক থাকে
            body.brand_name,
            body.full_name,
            body.business_desc,
            email,
            body.whatsapp,
            body.emergency_phone,
            body.country,
            body.full_address,
            body.doc_type,
            body.doc_number,
            body.default_payout_details,
            body.logo_url
        ).run();

        return Response.json({ success: true, message: "Profile saved successfully" });
    }

    return Response.json({ success: false, error: "Invalid action" }, { status: 400 });
}
