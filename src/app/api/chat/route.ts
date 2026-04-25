import OpenAI from "openai";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are Tyee Study Buddy, continuing a follow-up chat with a middle-school student about a homework question you already answered.

You will be given:
1. The original question.
2. The explanation you already gave.
3. The running chat history.

Your job: answer the student's follow-up clearly and briefly, in plain English a 12-year-old will understand. Reference the earlier explanation when helpful. Keep replies short (1-3 short paragraphs). Be warm and encouraging. Plain text only — no JSON, no markdown headers.`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      question?: string;
      explanation?: string;
      messages?: ChatMessage[];
    };
    const { question, explanation, messages } = body;

    if (!question || !explanation || !Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Missing question, explanation, or messages." },
        { status: 400 }
      );
    }

    const apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.AZURE_OPENAI_ENDPOINT || process.env.OPENAI_BASE_URL;
    const model =
      process.env.AZURE_OPENAI_DEPLOYMENT || process.env.OPENAI_MODEL || "gpt-4o-mini";

    if (!apiKey) {
      return Response.json({ error: "Server is missing API key." }, { status: 500 });
    }

    const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });

    const context = `ORIGINAL QUESTION:\n${question}\n\nEXPLANATION ALREADY GIVEN:\n${explanation}`;

    const input: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: context },
      ...messages,
    ];

    console.log("[chat] request", { model, turns: messages.length });

    const response = await client.responses.create({
      model,
      input,
      reasoning: { effort: "medium" },
    });

    const reply = response.output_text ?? "";
    return Response.json({ reply });
  } catch (err) {
    const e = err as { status?: number; message?: string };
    console.error("[chat] failed", e);
    return Response.json(
      { error: `Upstream ${e.status ?? ""}: ${e.message ?? "unknown"}` },
      { status: 502 }
    );
  }
}
