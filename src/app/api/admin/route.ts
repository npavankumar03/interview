import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOne, getMany, query } from "@/lib/db";
import { getAllSettings, setSetting } from "@/lib/settings";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  const user = await getOne("SELECT id, role FROM users WHERE email = $1", [session.user.email]);
  if (!user || user.role !== "admin") return null;
  return user;
}

// GET: Fetch all admin data (users, settings)
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const action = request.nextUrl.searchParams.get("action");

  if (action === "settings") {
    const settings = await getAllSettings();
    // Mask API keys for display (show last 4 chars)
    const masked: Record<string, string> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (key.includes("key") || key.includes("secret")) {
        masked[key] = value ? `${"•".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}` : "";
      } else {
        masked[key] = value;
      }
    }
    return NextResponse.json({ settings: masked });
  }

  // Default: return users list
  const users = await getMany(
    `SELECT id, email, name, role, plan, credits, created_at
     FROM users ORDER BY created_at DESC`
  );

  const stats = await getOne(
    `SELECT
       COUNT(*) as total_users,
       COUNT(*) FILTER (WHERE plan = 'pro') as pro_users,
       COUNT(*) FILTER (WHERE role = 'admin') as admins,
       SUM(credits) as total_credits
     FROM users`
  );

  return NextResponse.json({ users, stats });
}

// POST: Admin actions (update user, update settings)
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();

  switch (body.action) {
    case "grant_credits": {
      const { userId, credits } = body;
      if (!userId || credits === undefined) {
        return NextResponse.json({ error: "userId and credits required" }, { status: 400 });
      }
      await query("UPDATE users SET credits = credits + $1 WHERE id = $2", [credits, userId]);
      return NextResponse.json({ success: true });
    }

    case "set_credits": {
      const { userId, credits } = body;
      if (!userId || credits === undefined) {
        return NextResponse.json({ error: "userId and credits required" }, { status: 400 });
      }
      await query("UPDATE users SET credits = $1 WHERE id = $2", [credits, userId]);
      return NextResponse.json({ success: true });
    }

    case "set_plan": {
      const { userId, plan } = body;
      if (!userId || !["free", "pro"].includes(plan)) {
        return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
      }
      const newCredits = plan === "pro" ? 999999 : 3;
      await query("UPDATE users SET plan = $1, credits = $2 WHERE id = $3", [plan, newCredits, userId]);
      return NextResponse.json({ success: true });
    }

    case "set_role": {
      const { userId, role } = body;
      if (!userId || !["user", "admin"].includes(role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      await query("UPDATE users SET role = $1 WHERE id = $2", [role, userId]);
      return NextResponse.json({ success: true });
    }

    case "delete_user": {
      const { userId } = body;
      if (userId === admin.id) {
        return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
      }
      await query("DELETE FROM users WHERE id = $1", [userId]);
      return NextResponse.json({ success: true });
    }

    case "update_setting": {
      const { key, value } = body;
      if (!key) {
        return NextResponse.json({ error: "key required" }, { status: 400 });
      }
      await setSetting(key, value || "");
      return NextResponse.json({ success: true });
    }

    case "update_settings_batch": {
      const { settings } = body;
      if (!settings || typeof settings !== "object") {
        return NextResponse.json({ error: "settings object required" }, { status: 400 });
      }
      for (const [key, value] of Object.entries(settings)) {
        if (typeof value === "string" && !value.startsWith("•")) {
          await setSetting(key, value);
        }
      }
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
