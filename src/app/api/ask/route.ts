import OpenAI from "openai";
import type { StudyResult } from "@/lib/types";

export const runtime = "nodejs";

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) return text.slice(first, last + 1);
  return text.trim();
}

const SYSTEM_PROMPT = `You are Tyee Study Buddy, a friendly homework helper for middle-school students (grades 6-8).

For every question, return a JSON object with this exact shape:
{
  "subject": "math" | "concept" | "off_topic", // "math" for math/geometry problems; "concept" for science/history/English/other middle-school subjects; "off_topic" if it's NOT a middle-school homework question (e.g. casual chat, adult topics, requests for personal info, jokes, coding help, etc.)
  "explanation": string,   // 2-4 short paragraphs in plain English. Use simple words, concrete examples, and analogies a 12-year-old will get. Avoid jargon; if you must use a term, define it.
  "tip": string,           // ONE short smart tip (1-2 sentences) to help the student remember or understand this. A memory trick, mnemonic, quick summary, or the single most important takeaway. Make it catchy and memorable.
  "image_prompt": string,  // A short visual description (1-2 sentences) suitable for an image generator, ONLY if a picture would clearly help understanding (diagrams, biology, geography, geometry shapes, historical scenes, etc.). Style: "flat educational illustration, clear labels, simple bright colors, kid-friendly textbook style". Set to "" (empty string) when an image would not add value (e.g. solving a basic equation, grammar question, off-topic).
  "flashcards": [          // 1 to 5 flashcards. For math: similar worked problems (front=problem, back=answer+short solution). For other subjects: key concept names and definitions.
    {
      "term": string,      // front of the card — concept name OR the practice problem
      "definition": string // back of the card — definition OR the answer with a brief solution
    }
  ],
  "quiz": [                // exactly 3 multiple-choice questions that test understanding
    {
      "question": string,
      "choices": [
        { "label": "A", "text": string },
        { "label": "B", "text": string },
        { "label": "C", "text": string },
        { "label": "D", "text": string }
      ],
      "correct": "A" | "B" | "C" | "D",
      "explanation": string  // 1-2 sentences explaining why the correct answer is right and common wrong answers are wrong
    }
  ]
}

Rules:
- Output ONLY valid JSON. No markdown, no backticks, no commentary.
- Keep a warm, encouraging tone.
- If the question does NOT look like a middle-school homework question, set "subject": "off_topic". In that case: write a short, friendly "explanation" (1-2 sentences) gently redirecting the student to ask a homework question, set "tip" to a short encouraging hint about what kinds of questions to ask, and return EMPTY arrays for "flashcards" and "quiz" (i.e. [] for both). Do not invent a topic.
- IMPORTANT: If the user attached an image OR a document (PDF/Word text included after a "--- PDF:" or "--- Word:" or "--- Text:" marker), treat THAT attached material as the homework. Do NOT classify as off_topic just because the user's typed question is short like "help me understand this" — the attachment IS the question. Read the attached text/image, identify the actual problem or topic, and answer it.

Subject-specific guidance:

MATH problems (solving an equation, computing something, geometry, etc.):
- "explanation": show the step-by-step solution to THIS specific problem, with the final answer clearly stated. You may also mention the formula/rule being applied.
- "flashcards": 3 to 5 WORKED EXAMPLES — similar problems that use the SAME PROBLEM FORMAT and SAME SOLUTION TECHNIQUE as the user's question. This is critical: if the user gives triangle vertices in coordinates, your problems must ALSO give coordinates (not base/height). If the user solves a 2-step equation with distribution, your problems must ALSO require distribution. If the user's problem uses fractions, yours should use fractions. Change only the numbers, never simplify the setup. Put the problem in "term" (e.g. "Find the area of a triangle with vertices at (1,2), (7,2), (4,6)") and the answer in "definition" formatted as: "Answer: <result>\\n\\nStep 1: ...\\nStep 2: ...". Use \\n for line breaks. Do NOT repeat the user's exact numbers; generate new ones. The student flips the card to self-check.
- "quiz": 3 NEW problems — same rules: SAME PROBLEM FORMAT and SAME SOLUTION TECHNIQUE as the user's question (different numbers from the flashcards), as multiple choice. Each choice is a numeric/expression answer. The "explanation" field should briefly show the correct work.

SCIENCE / HISTORY / ENGLISH / other conceptual questions:
- "explanation": explain the concept being asked about.
- "flashcards": key terms and their definitions that relate to the answer.
- "quiz": 3 questions that test understanding of the SAME concept at middle-school level — not random trivia.

Always match the difficulty of the user's question. Harder question → harder practice. Simpler question → simpler practice.`;

type ContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail: "auto" | "low" | "high" };

async function extractFiles(files: File[]): Promise<{
  textParts: string[];
  imageParts: ContentPart[];
  warnings: string[];
}> {
  const textParts: string[] = [];
  const imageParts: ContentPart[] = [];
  const warnings: string[] = [];

  for (const f of files) {
    const name = f.name;
    const type = f.type;
    const buf = Buffer.from(await f.arrayBuffer());
    try {
      if (type.startsWith("image/")) {
        const dataUrl = `data:${type};base64,${buf.toString("base64")}`;
        imageParts.push({ type: "input_image", image_url: dataUrl, detail: "auto" });
      } else if (type === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
        const { extractText } = await import("unpdf");
        const result = await extractText(new Uint8Array(buf), { mergePages: true });
        const text = (Array.isArray(result.text) ? result.text.join("\n") : result.text).trim();
        if (!text) {
          warnings.push(`PDF "${name}" had no extractable text (scanned image?).`);
        } else {
          textParts.push(`--- PDF: ${name} ---\n${text}`);
        }
      } else if (
        type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        name.toLowerCase().endsWith(".docx")
      ) {
        const mammoth = (await import("mammoth")) as unknown as {
          extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }>;
        };
        const result = await mammoth.extractRawText({ buffer: buf });
        textParts.push(`--- Word: ${name} ---\n${result.value.trim()}`);
      } else if (type === "text/plain" || name.toLowerCase().endsWith(".txt")) {
        textParts.push(`--- Text: ${name} ---\n${buf.toString("utf-8").trim()}`);
      } else {
        warnings.push(`Unsupported file: ${name} (${type || "unknown type"})`);
      }
    } catch (err) {
      warnings.push(
        `Could not read ${name}: ${err instanceof Error ? err.message : "parse error"}`
      );
    }
  }

  return { textParts, imageParts, warnings };
}

export async function POST(request: Request) {
  try {
    let question = "";
    let files: File[] = [];

    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      question = String(form.get("question") || "");
      files = form.getAll("files").filter((v): v is File => v instanceof File);
    } else {
      const body = (await request.json()) as { question?: string };
      question = body.question || "";
    }

    if (!question.trim() && files.length === 0) {
      return Response.json({ error: "Please enter a question or attach a file." }, { status: 400 });
    }
    if (!question.trim()) question = "Please help me with the attached material.";

    const apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.AZURE_OPENAI_ENDPOINT || process.env.OPENAI_BASE_URL;
    const model =
      process.env.AZURE_OPENAI_DEPLOYMENT ||
      process.env.OPENAI_MODEL ||
      "gpt-4o-mini";

    if (!apiKey) {
      return Response.json(
        { error: "Server is missing AZURE_OPENAI_API_KEY (or OPENAI_API_KEY)." },
        { status: 500 }
      );
    }

    const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });

    const { textParts, imageParts, warnings } = await extractFiles(files);

    let userText = question;
    if (textParts.length) {
      userText += `\n\nThe student also attached the following document(s):\n\n${textParts.join("\n\n")}`;
    }
    if (warnings.length) {
      console.warn("[ask] file warnings", warnings);
    }

    const userContent: ContentPart[] = [
      { type: "input_text", text: userText },
      ...imageParts,
    ];

    console.log("[ask] request", {
      baseURL,
      model,
      apiKeyPrefix: apiKey.slice(0, 6) + "…",
      questionPreview: question.slice(0, 80),
      attachedFiles: files.map((f) => `${f.name} (${f.type || "?"})`),
      extractedTextChars: textParts.reduce((n, t) => n + t.length, 0),
      images: imageParts.length,
    });
    console.log("[ask] system prompt ↓↓↓\n" + SYSTEM_PROMPT);
    console.log("[ask] user prompt (first 2000 chars) ↓↓↓\n" + userText.slice(0, 2000));
    console.log(`[ask] FULL user prompt length: ${userText.length} chars`);
    if (warnings.length) console.log("[ask] file warnings:", warnings);
    const t0 = Date.now();

    let raw = "";
    try {
      const response = await client.responses.create({
        model,
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      });
      raw = response.output_text ?? "";
      console.log(`[ask] completed in ${Date.now() - t0}ms, ${raw.length} chars`);
      console.log("[ask] raw model output ↓↓↓\n" + raw);
    } catch (apiErr: unknown) {
      const e = apiErr as {
        status?: number;
        message?: string;
        error?: unknown;
        code?: string;
        response?: { data?: unknown };
      };
      console.error("[ask] OpenAI call failed", {
        status: e.status,
        code: e.code,
        message: e.message,
        error: e.error,
        responseData: e.response?.data,
      });
      return Response.json(
        {
          error: `Upstream ${e.status ?? ""}: ${e.message ?? "unknown"}`,
          details: e.error ?? e.response?.data ?? null,
          requestUrl: `${baseURL ?? "https://api.openai.com/v1"}/chat/completions`,
          model,
        },
        { status: 502 }
      );
    }

    const jsonText = extractJson(raw);
    let parsed: StudyResult;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      return Response.json(
        { error: "Model returned invalid JSON. Try asking again.", raw },
        { status: 502 }
      );
    }

    return Response.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
