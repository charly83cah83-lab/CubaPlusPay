import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Content-Type": "application/json" };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: cors });
function getSecretKey() { const direct = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); if (direct) return direct; try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default || ""; } catch { return ""; } }

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "METHOD_NOT_ALLOWED" }, 405);
  const appId = Deno.env.get("QVAPAY_APP_ID"), appSecret = Deno.env.get("QVAPAY_APP_SECRET"), url = Deno.env.get("SUPABASE_URL"), secretKey = getSecretKey();
  if (!appId || !appSecret) return reply({ error: "QVAPAY_NOT_CONFIGURED", message: "Faltan QVAPAY_APP_ID o QVAPAY_APP_SECRET en los secretos de este proyecto Supabase." }, 503);
  if (!url || !secretKey) return reply({ error: "SUPABASE_SERVER_KEY_MISSING" }, 503);
  const authHeader = req.headers.get("Authorization") || "", token = authHeader.replace(/^Bearer\\s+/i, "");
  if (!token || token === authHeader) return reply({ error: "AUTH_REQUIRED" }, 401);
  const authKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!authKey) return reply({ error: "SUPABASE_PUBLIC_KEY_MISSING" }, 503);
  const authClient = createClient(url, authKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData.user) return reply({ error: "INVALID_SESSION" }, 401);
  let body: Record<string, unknown>; try { body = await req.json(); } catch { return reply({ error: "INVALID_JSON" }, 400); }
  if (body.action !== "create_invoice") return reply({ error: "UNSUPPORTED_ACTION" }, 400);
  const amount = Number(body.amount), keyInput = String(body.idempotency_key || "");
  if (!Number.isFinite(amount) || amount < 1 || amount > 100000 || Math.round(amount * 100) !== amount * 100) return reply({ error: "INVALID_AMOUNT" }, 400);
  if (!/^[A-Za-z0-9:_-]{8,100}$/.test(keyInput)) return reply({ error: "INVALID_IDEMPOTENCY_KEY" }, 400);
  const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } }), idempotencyKey = `${userData.user.id}:${keyInput}`;
  const { data: existing } = await admin.from("cm_payment_intents").select("*").eq("provider", "qvapay").eq("idempotency_key", idempotencyKey).maybeSingle();
  if (existing) {
    if (existing.user_id !== userData.user.id) return reply({ error: "IDEMPOTENCY_CONFLICT" }, 409);
    if (existing.checkout_url) return reply({ ok: true, reused: true, payment_url: existing.checkout_url, status: existing.status, payment_intent_id: existing.id });
    return reply({ error: "REQUEST_ALREADY_PROCESSING", payment_intent_id: existing.id }, 409);
  }
  const { data: intent, error: insertError } = await admin.from("cm_payment_intents").insert({ user_id: userData.user.id, provider: "qvapay", amount, currency: "USD", status: "created", idempotency_key: idempotencyKey, provider_payload: { source: "compramundo_web" } }).select("id").single();
  if (insertError || !intent) return reply({ error: "PAYMENT_INTENT_CREATE_FAILED" }, 500);
  let providerResponse: Response;
  try {
    providerResponse = await fetch("https://api.qvapay.com/v2/create_invoice", { method: "POST", headers: { "Content-Type": "application/json", "app-id": appId, "app-secret": appSecret }, body: JSON.stringify({ amount, description: `CompraMundo wallet top-up ${intent.id}`, remote_id: intent.id, webhook: `${url}/functions/v1/compramundo-qvapay-webhook` }), signal: AbortSignal.timeout(20000) });
  } catch {
    await admin.from("cm_payment_intents").update({ status: "failed", provider_payload: { error: "provider_network_error" } }).eq("id", intent.id);
    return reply({ error: "QVAPAY_UNREACHABLE" }, 502);
  }
  const raw = await providerResponse.text(); let result: Record<string, unknown> = {}; try { result = JSON.parse(raw); } catch {}
  const txn = String(result.transaction_uuid || result.uuid || ""), checkout = String(result.url || result.checkout_url || "");
  if (!providerResponse.ok || !txn || !checkout || !checkout.startsWith("https://")) {
    await admin.from("cm_payment_intents").update({ status: "failed", provider_payload: { http_status: providerResponse.status, provider_error: String(result.message || result.error || "invoice_creation_failed").slice(0, 300) } }).eq("id", intent.id);
    return reply({ error: "QVAPAY_INVOICE_FAILED", provider_status: providerResponse.status }, 502);
  }
  const { error: updateError } = await admin.from("cm_payment_intents").update({ external_reference: txn, checkout_url: checkout, status: "pending", provider_payload: { transaction_uuid: txn, invoice_created: true } }).eq("id", intent.id);
  if (updateError) return reply({ error: "INVOICE_SAVED_WITH_ERROR", payment_intent_id: intent.id }, 500);
  return reply({ ok: true, payment_url: checkout, payment_intent_id: intent.id, status: "pending", amount, currency: "USD", message: "El saldo CRX no se acredita al crear la factura." });
});