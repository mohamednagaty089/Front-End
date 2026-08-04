import { handleEmployeeManagementRequest } from "./handler.mjs";

export default async function handler(req, res) {
  // Debug: Log that the Vercel handler is being called
  // This will appear in Vercel's function logs
  console.log("=".repeat(50));
  console.log("[Vercel Handler] ===== REQUEST RECEIVED =====");
  console.log("[Vercel Handler] URL:", req.url);
  console.log("[Vercel Handler] Method:", req.method);
  console.log("[Vercel Handler] Path:", req.url?.split("?")[0]);
  console.log("=".repeat(50));
  
  // Vercel passes req and res, which are Node.js IncomingMessage and ServerResponse
  // Our handler expects the same format, so we can pass them directly
  try {
    const result = await handleEmployeeManagementRequest(req, res);
    console.log("[Vercel Handler] Request completed successfully");
    return result;
  } catch (error) {
    console.error("[Vercel Handler] ===== ERROR =====");
    console.error("[Vercel Handler] Error:", error);
    console.error("[Vercel Handler] Stack:", error.stack);
    console.error("=".repeat(50));
    
    // Only send error response if headers haven't been sent
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ 
        error: "Internal server error", 
        message: error.message,
        url: req.url 
      }));
    }
  }
}

