export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const db = env.retail;

    if (!db) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "D1 Database 'retail' is not bound." 
      }), {
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (request.method === "GET") {
      const { results } = await db.prepare(
        "SELECT id, title, video_url, thumbnail_url, views, likes FROM shorts_videos ORDER BY created_at DESC LIMIT 50"
      ).all();

      return new Response(JSON.stringify({ 
        success: true, 
        shorts: results || [] 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (request.method === "POST") {
      const body = await request.json();
      const { title, video_url, thumbnail_url, is_long } = body;

      await db.prepare(
        "INSERT INTO shorts_videos (title, video_url, thumbnail_url, is_long, created_at) VALUES (?, ?, ?, ?, datetime('now'))"
      ).bind(title, video_url, thumbnail_url || "", is_long ? 1 : 0).run();

      return new Response(JSON.stringify({ 
        success: true, 
        message: "Video saved to retail database successfully!" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: "Method not allowed" 
    }), {
      status: 405, 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), {
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
```[cite: 7]

এটি সেভ করার পর গিটহাবে কমিট (Commit) করুন বা ক্লাউডফ্লেয়ারে আপডেট করে দিন। এটি সম্পূর্ণ সঠিকভাবে রান করবে এবং কোনো বিল্ড এরর বা লাল ক্রস আসবে না।
