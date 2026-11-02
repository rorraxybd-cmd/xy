export async function onRequestPost(context) {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
    };

    try {
        const { request, env } = context;
        
        // রিকোয়েস্ট থেকে ডাটা পার্স করা
        const data = await request.json();
        const { country, fullName, email, whatsapp, budget, strategicPlan } = data;

        // ভ্যালিডেশন চেক
        if (!country || !fullName || !email || !whatsapp || !budget || !strategicPlan) {
            return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // Cloudflare D1 Database এ ডেটা ইনসার্ট করা
        const query = `
            INSERT INTO managing_directors (country, fullName, email, whatsapp, budget, strategicPlan, status)
            VALUES (?, ?, ?, ?, ?, ?, 'pending')
        `;

        // আপনার ক্লাউডফ্লেয়ার বাইন্ডিং নেম অনুযায়ী 'retail' ব্যবহার করা হয়েছে
        await env.retail.prepare(query)
            .bind(country, fullName, email, whatsapp, Number(budget), strategicPlan)
            .run();

        return new Response(JSON.stringify({ success: true, message: "Submitted successfully to Cloudflare D1!" }), {
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

// OPTIONS মেথড হ্যান্ডেল করার জন্য (CORS প্রিফ্লাইট রিকোয়েস্ট)
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
