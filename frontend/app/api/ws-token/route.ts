import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

/**
 * Server-side HMAC token generator for WebSocket authentication.
 * 
 * This endpoint replaces the previous client-side HMAC computation
 * (which exposed CAPTURE_SHARED_SECRET to the browser via NEXT_PUBLIC_).
 * 
 * The secret now lives ONLY on the server — never reaches the client bundle.
 * 
 * Flow:
 *   1. Client calls POST /api/ws-token with { clientId }
 *   2. Server computes HMAC-SHA256(clientId + timestamp, secret)
 *   3. Returns { token, timestamp } to client
 *   4. Client uses token+timestamp as query params on the WebSocket URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientId = body.clientId;

    if (!clientId || typeof clientId !== "string") {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const secret = process.env.CAPTURE_SHARED_SECRET;
    if (!secret) {
      // No secret configured — return a dev bypass token
      return NextResponse.json({
        token: "dev_signature_bypass",
        timestamp: String(Date.now() / 1000),
      });
    }

    const timestamp = String(Date.now() / 1000);
    const message = clientId + timestamp;
    
    // Compute HMAC-SHA256 using Node.js crypto (server-side only)
    const hmac = createHmac("sha256", secret);
    hmac.update(message);
    const token = hmac.digest("hex");

    return NextResponse.json({ token, timestamp });
  } catch (error) {
    console.error("[ws-token] Error generating token:", error);
    return NextResponse.json(
      { error: "Failed to generate WebSocket auth token" },
      { status: 500 }
    );
  }
}
