
export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    const json = (data, status = 200) =>
      new Response(JSON.stringify(data), {
        status,
        headers: {
          ...cors,
          "Content-Type": "application/json"
        }
      });

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/") {
      return json({
        name: "AHIYA AI CLOUD API",
        status: "online",
        version: "0.2.0"
      });
    }

    if (path === "/health") {
      return json({
        success: true,
        service: "AHIYA AI",
        status: "healthy",
        database: "D1 configured"
      });
    }

    if (path === "/api/info") {
      return json({
        api: "AHIYA AI",
        version: "0.2.0",
        features: [
          "D1 Database",
          "Chat History",
          "Knowledge Base",
          "User Settings"
        ]
      });
    }

    // Protect database endpoints with an API token.
    const token = env.API_TOKEN;

    if (!token) {
      return json({
        success: false,
        error: "API_TOKEN secret is not configured"
      }, 503);
    }

    if (
      request.headers.get("Authorization") !==
      `Bearer ${token}`
    ) {
      return json({
        success: false,
        error: "Unauthorized"
      }, 401);
    }

    if (!env.DB) {
      return json({
        success: false,
        error: "D1 database binding DB is missing"
      }, 503);
    }

    // Save a chat message.
    if (path === "/api/chat" && request.method === "POST") {
      try {
        const body = await request.json();

        const user_id = String(body.user_id || "").trim();
        const role = String(body.role || "").trim();
        const message = String(body.message || "").trim();

        if (!user_id || !message ||
            !["user", "assistant"].includes(role)) {
          return json({
            success: false,
            error: "Valid user_id, role and message are required"
          }, 400);
        }

        if (user_id.length > 128 || message.length > 20000) {
          return json({
            success: false,
            error: "Input too long"
          }, 400);
        }

        const id = crypto.randomUUID();

        await env.DB.prepare(
          `INSERT INTO chat_history
           (id, user_id, role, message)
           VALUES (?, ?, ?, ?)`
        ).bind(id, user_id, role, message).run();

        return json({
          success: true,
          message: "Chat saved",
          id
        }, 201);

      } catch (error) {
        return json({
          success: false,
          error: "Could not save chat"
        }, 500);
      }
    }

    // Read chat history.
    if (path === "/api/chat" && request.method === "GET") {
      const user_id = url.searchParams.get("user_id");

      if (!user_id || user_id.length > 128) {
        return json({
          success: false,
          error: "Valid user_id is required"
        }, 400);
      }

      try {
        const result = await env.DB.prepare(
          `SELECT id, user_id, role, message, created_at
           FROM chat_history
           WHERE user_id = ?
           ORDER BY created_at DESC
           LIMIT 50`
        ).bind(user_id).all();

        return json({
          success: true,
          chats: result.results || []
        });

      } catch (error) {
        return json({
          success: false,
          error: "Could not read chat history"
        }, 500);
      }
    }

    return json({
      success: false,
      error: "Endpoint not found"
    }, 404);
  }
};
