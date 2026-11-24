// Deno edge function: generate-guide
// Generates a step-by-step guide via Google Gemini, validates the response,
// and inserts the guide + ordered steps using the CALLER'S JWT so existing
// RLS ownership policies apply. The Gemini key lives only in function secrets.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_TASK_NAME = 200;
const MAX_DESCRIPTION = 2000;
const MAX_STEPS = 30;
const MAX_STEP_TITLE = 200;
const MAX_STEP_INSTRUCTION = 2000;
const AI_TIMEOUT_MS = 30_000;

interface ParsedStep {
  title: string;
  instruction: string;
}

interface ParsedGuide {
  title: string;
  description: string;
  steps: ParsedStep[];
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number): Response {
  return json({ error: message }, status);
}

/** Creates a Supabase client that authenticates as the CALLER via their JWT. */
function createUserClient(req: Request): { client: SupabaseClient; userId: string } {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Response(JSON.stringify({ error: "Missing authorization token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  return { client, userId: "resolved-after-user-call" };
}

async function resolveUserId(client: SupabaseClient): Promise<string | null> {
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) return null;
  return data.user.id;
}

function validateInput(body: unknown): { taskName: string; description: string } | string {
  if (typeof body !== "object" || body === null) return "Request body must be a JSON object.";
  const { taskName, description } = body as Record<string, unknown>;

  if (typeof taskName !== "string" || taskName.trim().length === 0) {
    return "taskName is required.";
  }
  if (taskName.trim().length > MAX_TASK_NAME) {
    return `taskName must be at most ${MAX_TASK_NAME} characters.`;
  }
  if (description !== undefined && description !== null && typeof description !== "string") {
    return "description must be a string.";
  }
  const desc = typeof description === "string" ? description.trim() : "";
  if (desc.length > MAX_DESCRIPTION) {
    return `description must be at most ${MAX_DESCRIPTION} characters.`;
  }
  return { taskName: taskName.trim(), description: desc };
}

const PROMPT_SYSTEM = `You are a practical how-to guide writer for beginners.
Given a task name and optional description, produce a step-by-step guide.
Rules:
- Return ONLY valid JSON matching this exact shape (no markdown fences, no commentary):
  {"title": string, "description": string, "steps": [{"title": string, "instruction": string}]}
- "title": concise guide title (max 120 characters).
- "description": one or two sentences summarizing the guide (max 300 characters).
- "steps": 3 to 15 steps, ordered chronologically.
- Each step "title": short imperative phrase (max 100 characters).
- Each step "instruction": 1-3 clear sentences a complete beginner can follow (max 600 characters).
- Include safety warnings inline where relevant (e.g. electrical, fire, sharp tools).`;

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  // Strip markdown fences if the model added them despite instructions.
  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(withoutFences);
  } catch {
    // Fallback: grab the outermost { ... } block.
    const start = withoutFences.indexOf("{");
    const end = withoutFences.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(withoutFences.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

function validateAiGuide(raw: unknown): ParsedGuide | string {
  if (typeof raw !== "object" || raw === null) return "AI response is not a JSON object.";
  const obj = raw as Record<string, unknown>;

  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  if (!title) return "AI response missing a valid title.";
  if (title.length > 120) return "AI title too long.";

  const description = typeof obj.description === "string" ? obj.description.trim() : "";
  if (description.length > 300) return "AI description too long.";

  if (!Array.isArray(obj.steps)) return "AI response missing a steps array.";
  const rawSteps = obj.steps;
  if (rawSteps.length < 3) return "AI returned fewer than 3 steps.";
  if (rawSteps.length > MAX_STEPS) return `AI returned more than ${MAX_STEPS} steps.`;

  const steps: ParsedStep[] = [];
  for (const s of rawSteps) {
    if (typeof s !== "object" || s === null) return "AI step is not an object.";
    const st = s as Record<string, unknown>;
    const stTitle = typeof st.title === "string" ? st.title.trim() : "";
    const stInstruction = typeof st.instruction === "string" ? st.instruction.trim() : "";
    if (!stTitle) return "AI step missing a title.";
    if (!stInstruction) return "AI step missing instruction.";
    if (stTitle.length > MAX_STEP_TITLE) return "AI step title too long.";
    if (stInstruction.length > MAX_STEP_INSTRUCTION) return "AI step instruction too long.";
    steps.push({ title: stTitle, instruction: stInstruction });
  }

  return { title: title.slice(0, MAX_STEP_TITLE), description: description.slice(0, 300), steps };
}

async function callGemini(taskName: string, description: string): Promise<ParsedGuide | string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) return "AI provider is not configured.";

  const userPart = `Task: ${taskName}\n${description ? `Details: ${description}` : ""}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  let resp: Response;
  try {
    resp = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: PROMPT_SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: userPart }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof DOMException && e.name === "AbortError") {
      return "AI request timed out. Please try again.";
    }
    return "Could not reach the AI provider.";
  }
  clearTimeout(timer);

  if (!resp.ok) {
    if (resp.status === 429) return "AI provider is rate-limited. Please try again shortly.";
    if (resp.status === 401 || resp.status === 403) return "AI provider rejected the request (check API key).";
    return `AI provider returned status ${resp.status}.`;
  }

  let body: unknown;
  try {
    body = await resp.json();
  } catch {
    return "AI provider returned invalid JSON.";
  }

  const candidates = (body as { candidates?: { content?: { parts?: { text?: string }[] } }[] })
    .candidates;
  const text = candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text) return "AI provider returned an empty response.";

  const parsed = extractJson(text);
  if (parsed === null) return "AI returned malformed JSON.";
  return validateAiGuide(parsed);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return errorResponse("Method not allowed. Use POST.", 405);
    }

    // JWT verification is additionally enforced at the gateway via
    // verify_jwt=true in config.toml; this is a second, explicit check.
    const { client } = createUserClient(req);
    const userId = await resolveUserId(client);
    if (!userId) {
      return errorResponse("Unauthorized. Please sign in.", 401);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON body.", 400);
    }

    const input = validateInput(body);
    if (typeof input === "string") return errorResponse(input, 400);

    const guide = await callGemini(input.taskName, input.description);
    if (typeof guide === "string") return errorResponse(guide, 502);

    // Insert guide + steps as the CALLER (RLS enforces ownership).
    const { data: guideRow, error: guideErr } = await client
      .from("guides")
      .insert({
        title: guide.title,
        description: guide.description,
        status: "in_progress",
      })
      .select("id")
      .single();

    if (guideErr || !guideRow) {
      console.error("guide insert failed:", guideErr?.message ?? "no row");
      return errorResponse("Could not save the guide. Please try again.", 500);
    }
    const guideId = (guideRow as { id: string }).id;

    const { error: stepsErr } = await client.from("guide_steps").insert(
      guide.steps.map((s, i) => ({
        guide_id: guideId,
        position: i + 1,
        title: s.title,
        instruction: s.instruction,
      })),
    );

    if (stepsErr) {
      console.error("step insert failed:", stepsErr.message);
      // Cleanup: cascade deletes any steps that made it in.
      await client.from("guides").delete().eq("id", guideId);
      return errorResponse("Could not save the guide steps. Please try again.", 500);
    }

    return json({ guideId }, 200);
  } catch (err) {
    console.error("unexpected error:", err instanceof Error ? err.message : String(err));
    return errorResponse("Internal server error.", 500);
  }
});
