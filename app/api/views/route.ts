import { NextRequest, NextResponse } from "next/server";
import { getTotalViews, recordVisitorView } from "@/lib/mongodb";

const COOKIE_NAME = "moviemela_session_id";
const TWO_HOURS_SECONDS = 7200; // 2 hours

export async function GET() {
  try {
    const totalViews = await getTotalViews();
    return NextResponse.json({ totalViews, success: true });
  } catch (error: any) {
    console.error("GET /api/views error:", error);
    return NextResponse.json({ totalViews: 0, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Get or generate anonymous session ID
    let sessionId = req.cookies.get(COOKIE_NAME)?.value || "";
    const isBrandNewSession = !sessionId;

    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }

    // 2. Extract Client IP
    const forwarded = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip = (forwarded ? forwarded.split(",")[0].trim() : realIp) || "unknown";

    // 3. Record in MongoDB Atlas (checks 2-hour window & increments if new/expired)
    const { totalViews, isNewView } = await recordVisitorView(sessionId, ip);

    // 4. Return response and refresh 2-hour cookie
    const response = NextResponse.json({
      success: true,
      totalViews,
      isNewView,
    });

    // Set 2-hour session cookie (expires after 7200 seconds)
    response.cookies.set({
      name: COOKIE_NAME,
      value: sessionId,
      maxAge: TWO_HOURS_SECONDS,
      path: "/",
      sameSite: "lax",
      httpOnly: false, // accessible to client if needed
    });

    return response;
  } catch (error: any) {
    console.error("POST /api/views error:", error);
    return NextResponse.json({ totalViews: 1, error: error.message }, { status: 500 });
  }
}
