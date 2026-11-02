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
        const { fullName, email, whatsapp, budget, projectDetails, country, countryCode, ipAddress } = data;

        if (!fullName || !email || !whatsapp || !budget || !projectDetails) {
            return new Response(JSON.stringify({ success: false, error: "Missing required fields" }), {
                status: 400,
                headers: corsHeaders
            });
        }

        const query = `
            INSERT INTO project_requests (fullName, email, whatsapp, budget, projectDetails, country, countryCode, ipAddress, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `;

        // এখানে env.DB এর পরিবর্তে আপনার বাইন্ডিং নেম 'retail' ব্যবহার করা হয়েছে
        await env.retail.prepare(query)
            .bind(
                fullName, 
                email, 
                whatsapp, 
                Number(budget), 
                projectDetails, 
                country || 'Global Region', 
                countryCode || 'un', 
                ipAddress || ''
            )
            .run();

        return new Response(JSON.stringify({ success: true, message: "Submitted successfully to Cloudflare!" }), {
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
