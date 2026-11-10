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

### ক্লাউডফ্লেয়ারে বিল্ড এরর এড়ানোর করণীয়:
১. নিশ্চিত করুন যে ফাইলটির নাম **`shorts.js`** হয়েছে এবং এটি ঠিক **`functions/api/`** ফোল্ডারের ভেতরেই আছে।
২. গিটহাবে পুশ করার সময় বা ক্লাউডফ্লেয়ারে সরাসরি আপলোড করার সময় যেন কোনো `.txt` বা ভুল এক্সটেনশন ফাইল না চলে যায়। 
৩. ক্লাউডফ্লেয়ার ড্যাশবোর্ডের **Functions** সেটিংসে গিয়ে রাউটিং ঠিক আছে কি না তা একবার চেক করে নিতে পারেন। 

এটি ঠিকমতো আপলোড করলেই ক্লাউডফ্লেয়ার বিল্ড সাকসেসফুল দেখাবে এবং ক্রস চিহ্ন চলে যাবে।
