import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOne, getMany } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getOne(
      "SELECT id, plan, credits FROM users WHERE email = $1",
      [session.user.email]
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const sessions = await getMany(
      `SELECT id, title, created_at, duration_seconds, audio_source
       FROM sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [user.id]
    );

    return NextResponse.json({
      plan: user.plan,
      credits: user.credits,
      sessions,
    });
  } catch (error) {
    console.error("Usage API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
