import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
function getSecretKey() { const direct = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); if (direct) return direct; try { return JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default || ""; } catch { return ""; } }
function safeEqualHex(a: string, b: string) { if (!/^[0-9a-f]{64}$/i.test(a) || !/^[0-9a-f]{64}$/i.test(b)) return false; const aa = Uint8Array.from(a.match(/.{2}/g)!, x => parseInt(x, 16)), bb = Uint8Array.from(b.match(/.{2}/g)!, x => parseInt(x, 16)); let diff = 0; for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i]; return diff === 0; }
Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "METHOD_NOT_ALLOWED" }, 405);
  const appSecret = Deno.env.get("QVAPAY_APP_SECRET"), url = Deno.env.get("SUPABASE_URL"), serviceKey = getSecretKey();
  if (!appSecret || !url || !serviceKey) return json({ error: "WEBHOOK_NOT_CONFIGURED" }, 503);
  const raw = await req.text(), signature = (req.headers.get("x-qvapay-signature") || "").replace(/^sha256=/i, ""), timestamp = Number(req.headers.get("x-qvapay-timestamp") || "0"), now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(timestamp) || Math.abs(now - timestamp) > 300) return json({ error: "STALE_TIMESTAMP" }, 401);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(appSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), digest = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw))), expected = Array.from(digest, b => b.toString(16).padStart(2, "0")).join("");
  if (!safeEqualHex(signature, expected)) return json({ error: "INVALID_SIGNATURE" }, 401);
  let payload: Record<string, unknown>; try { payload = JSON.parse(raw); } catch { return json({ error: "INVALID_JSON" }, 400); }
  const remoteId = String(payload.remote_id || ""), status = String(payload.status || "").toLowerCase(), amount = Number(payload.amount), txn = String(payload.transaction_uuid || payload.uuid || "");
  if (!remoteId || !Number.isFinite(amount) || amount <= 0) return json({ error: "INVALID_EVENT" }, 400);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: intent, error: findError } = await admin.from("cm_payment_intents").select("id,user_id,provider,amount,currency,status,external_reference").eq("id", remoteId).eq("provider", "qvapay").maybeSingle();
  if (findError) return json({ error: "DATABASE_LOOKUP_FAILED" }, 500);
  if (!intent) return json({ error: "UNKNOWN_PAYMENT_INTENT" }, 404);
  if (Math.abs(Number(intent.amount) - amount) > 0.000001 || intent.currency !== "USD") return json({ error: "AMOUNT_MISMATCH" }, 400);
  if (txn && intent.external_reference && txn !== intent.external_reference) return json({ error: "TRANSACTION_MISMATCH" }, 400);
  const eventId = `${remoteId}:${status}:${String(payload.updated_at || payload.created_at || txn || "event")}`;
  const { error: eventError } = await admin.from("cm_provider_events").upsert({ provider: "qvapay", event_id: eventId, event_type: status || "unknown", signature_valid: true, processed_at: new Date().toISOString(), payload: { remote_id: remoteId, status, amount, transaction_uuid: txn || intent.external_reference } }, { onConflict: "provider,event_id", ignoreDuplicates: true });
  if (eventError) return json({ error: "EVENT_LOG_FAILED" }, 500);
  if (["paid", "completed", "confirmed"].includes(status)) {
    if (["failed", "cancelled", "expired"].includes(intent.status)) return json({ ok: true, ignored: true, reason: "terminal_intent_state" });
    const { error } = await admin.from("cm_payment_intents").update({ status: "confirmed", external_reference: intent.external_reference || txn || null, provider_payload: { webhook_verified: true, provider_status: status, amount } }).eq("id", remoteId).in("status", ["created", "pending", "confirmed"]);
    if (error) return json({ error: "INTENT_UPDATE_FAILED" }, 500);
    return json({ ok: true, confirmed: true, credited_crx: false, message: "Pago confirmado; CRX no se acredita automáticamente sin tasa de conversión y conciliación configuradas." });
  }
  if (["failed", "cancelled", "expired"].includes(status)) { const { error } = await admin.from("cm_payment_intents").update({ status }).eq("id", remoteId).in("status", ["created", "pending"]); if (error) return json({ error: "INTENT_UPDATE_FAILED" }, 500); }
  return json({ ok: true, processed: true, status });
});