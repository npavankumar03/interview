import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { getOne, query } from "@/lib/db";

const SYSTEM_PROMPT = `You are ZoomMate, an AI interview assistant. The user is in a live job interview and needs quick, natural-sounding answers.

Rules:
- Give concise, professional answers (2-4 sentences max unless a detailed response is clearly needed)
- Use the STAR method (Situation, Task, Action, Result) for behavioral questions
- Sound natural and conversational, not robotic
- If the question is technical, give accurate but accessible answers
- If you're unsure about context, give a flexible answer the user can adapt
- Never say "As an AI" — you're helping the user answer, not answering as yourself
- Format answers so they're easy to scan quickly (the user is in a live conversation)
- If the transcript is unclear or incomplete, provide the best answer you can based on what you have`;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check credits
    const user = await getOne("SELECT id, credits FROM users WHERE email = $1", [session.user.email]);
    if (!user || user.credits <= 0) {
      return NextResponse.json(
        { error: "No credits remaining. Contact admin for more credits." },
        { status: 403 }
      );
    }

    const { question, context } = await request.json();

    if (!question || !question.trim()) {
      return NextResponse.json({ error: "No question provided" }, { status: 400 });
    }

    const apiKey = await getSetting("openai_api_key");
    const model = (await getSetting("openai_model")) || "gpt-4o";

    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured. Contact admin." }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });

    const userMessage = context
      ? `Interview transcript so far:\n${context}\n\nLatest question to answer:\n${question}`
      : `Interview question to answer:\n${question}`;

    const response = await openai.chat.completions.create({
      model,
      max_tokens: 500,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const answer = response.choices[0]?.message?.content || "Unable to generate answer.";

    // Deduct 1 credit
    await query("UPDATE users SET credits = credits - 1 WHERE id = $1", [user.id]);

    return NextResponse.json({
      answer,
      creditsRemaining: user.credits - 1,
    });
  } catch (error: any) {
    console.error("Generation error:", error);

    if (error?.status === 429) {
      return NextResponse.json({ error: "Rate limited. Please wait a moment." }, { status: 429 });
    }

    return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });
  }
}
