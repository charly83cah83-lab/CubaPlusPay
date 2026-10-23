import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Keep JWT verification enabled at the Supabase gateway. Never trust client-supplied user IDs.
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return json({ error: "Authentication required" }, 401);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return json({ error: "IA no configurada: falta el secreto OPENAI_API_KEY en Supabase." }, 503);

  let body: { prompt?: string; mode?: string };
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const prompt = String(body.prompt ?? "").trim();
  const mode = String(body.mode ?? "business").slice(0, 40);
  if (!prompt || prompt.length > 8000) return json({ error: "El texto debe tener entre 1 y 8000 caracteres." }, 400);

  const model = Deno.env.get("OPENAI_MODEL") || "gpt-4.1-mini";
  const system = `Eres NEXO ONE AI, un copiloto de creación de negocios y diseño de software. Responde en español claro, con estructura concisa y pasos accionables. No inventes datos, ventas, saldos ni resultados de pruebas. Distingue hipótesis de hechos. No prometas riqueza ni rentabilidad. Para aplicaciones, genera especificaciones, arquitectura, pantallas, modelos de datos, criterios de aceptación y pruebas; declara explícitamente qué queda por implementar. Nunca pidas secretos, contraseñas o claves privadas. No ejecutes pagos ni despliegues. Modo solicitado: ${mode}.`;

  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, instructions: system, input: prompt, max_output_tokens: 1600, store: false }),
      signal: AbortSignal.timeout(45000),
    });
    const data = await upstream.json();
    if (!upstream.ok) return json({ error: "El proveedor de IA no pudo completar la solicitud.", provider_status: upstream.status }, 502);
    const answer = typeof data.output_text === "string" ? data.output_text :
      (data.output ?? []).flatMap((item: any) => item.content ?? []).filter((c: any) => c.type === "output_text").map((c: any) => c.text).join("\n");
    if (!answer) return json({ error: "La IA no devolvió texto utilizable." }, 502);
    return json({ answer, model, mode, generated_at: new Date().toISOString() }, 200);
  } catch {
    return json({ error: "No se pudo conectar con el proveedor de IA. Inténtalo de nuevo." }, 502);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}
