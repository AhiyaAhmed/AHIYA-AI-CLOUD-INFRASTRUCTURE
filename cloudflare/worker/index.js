
export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);

    if (url.pathname === "/") {
      return Response.json({
        name: "AHIYA AI CLOUD API",
        status: "online",
        version: "0.1.0",
        message: "Welcome to AHIYA AI"
      }, { headers: corsHeaders });
    }

    if (url.pathname === "/health") {
      return Response.json({
        success: true,
        service: "AHIYA AI",
        status: "healthy",
        timestamp: new Date().toISOString()
      }, { headers: corsHeaders });
    }

    if (url.pathname === "/api/info") {
      return Response.json({
        api: "AHIYA AI",
        version: "0.1.0",
        features: [
          "AI Provider Hub",
          "Knowledge Base",
          "Automation",
          "Web Crawler"
        ]
      }, { headers: corsHeaders });
    }

    return Response.json({
      success: false,
      error: "Endpoint not found"
    }, {
      status: 404,
      headers: corsHeaders
    });
  }
};
