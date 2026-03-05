import { NextRequest, NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio data provided" }, { status: 400 });
    }

    const apiKey = await getSetting("deepgram_api_key");
    if (!apiKey) {
      return NextResponse.json({ error: "Deepgram API key not configured. Contact admin." }, { status: 500 });
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());

    const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": audioFile.type || "audio/webm",
      },
      body: buffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Deepgram error:", errorText);
      return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
    }

    const data = await response.json();
    const text = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
