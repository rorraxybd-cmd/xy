export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-File-Name",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }

  try {
    const url = new URL(request.url);
    const bucketType = url.searchParams.get("type") || "image";
    const targetBucket = bucketType === "video" ? env.video : env.image;

    if (!targetBucket) {
      return new Response(JSON.stringify({ success: false, error: `R2 Bucket for '${bucketType}' is not bound.` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const originalName = request.headers.get("X-File-Name") || `file_${Date.now()}`;
    const fileName = `${Date.now()}_${originalName.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
    const fileBuffer = await request.arrayBuffer();

    if (!fileBuffer || fileBuffer.byteLength === 0) {
      return new Response(JSON.stringify({ success: false, error: "No file uploaded or empty buffer" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    await targetBucket.put(fileName, fileBuffer, {
      httpMetadata: {
        contentType: request.headers.get("Content-Type") || (bucketType === "video" ? "video/mp4" : "image/webp"),
      },
    });

    const domainMap = {
      image: "https://img.rorraxy.com",
      video: "https://vid.rorraxy.com"
    };

    const fileUrl = `${domainMap[bucketType] || "https://img.rorraxy.com"}/${fileName}`;

    return new Response(JSON.stringify({
      success: true,
      message: "File uploaded to R2 successfully!",
      url: fileUrl,
      file_name: fileName
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
