import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { prompt } = (await request.json()) as { prompt?: string };
    if (!prompt || !prompt.trim()) {
      return Response.json({ error: "Missing prompt." }, { status: 400 });
    }

    const apiKey = process.env.AZURE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.AZURE_OPENAI_ENDPOINT || process.env.OPENAI_BASE_URL;
    const model =
      process.env.AZURE_IMAGE_DEPLOYMENT ||
      process.env.OPENAI_IMAGE_MODEL ||
      "gpt-image-2-1";

    if (!apiKey) {
      return Response.json({ error: "Server is missing API key." }, { status: 500 });
    }

    const client = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });

    console.log("[image] generate", { model, promptPreview: prompt.slice(0, 120) });
    const t0 = Date.now();

    const result = await client.images.generate({ model, prompt, quality: "low" });
    const b64 = result.data?.[0]?.b64_json;

    if (!b64) {
      return Response.json({ error: "No image returned." }, { status: 502 });
    }

    console.log(`[image] done in ${Date.now() - t0}ms, ${b64.length} b64 chars`);
    return Response.json({ dataUrl: `data:image/png;base64,${b64}` });
  } catch (err) {
    const e = err as { status?: number; message?: string; error?: unknown };
    console.error("[image] failed", e);
    return Response.json(
      { error: `Upstream ${e.status ?? ""}: ${e.message ?? "unknown"}` },
      { status: 502 }
    );
  }
}
