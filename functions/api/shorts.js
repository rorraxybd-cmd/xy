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
      return new Response(JSON.stringify({ success: false, error: "D1 Database 'retail' is not bound." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (request.method === "GET") {
      const { results } = await db.prepare(
        "SELECT id, title, video_url, thumbnail_url, views, likes FROM shorts_videos ORDER BY created_at DESC LIMIT 50"
      ).all();

      return new Response(JSON.stringify({ success: true, shorts: results || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (request.method === "POST") {
      const body = await request.json();
      const { title, video_url, thumbnail_url, is_long } = body;

      await db.prepare(
        "INSERT INTO shorts_videos (title, video_url, thumbnail_url, is_long, created_at) VALUES (?, ?, ?, ?, datetime('now'))"
      ).bind(title, video_url, thumbnail_url || "", is_long ? 1 : 0).run();

      return new Response(JSON.stringify({ success: true, message: "Video saved to retail database successfully!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
```[cite: 7]

এই ফাইলটি `functions/api/shorts.js` নামে আপলোড করে গিটহাবে পুশ করার পর (অথবা ক্লাউডফ্লেয়ারে রি-ডিপ্লয় করার পর) আপলোড পেজ থেকে ভিডিও আপলোড করলে আর এই JSON এররটি আসবে না এবং সরাসরি আপনার ইনডেক্স পেজে ভিডিও শো করবে[cite: 1, 2, 6, 7]।
