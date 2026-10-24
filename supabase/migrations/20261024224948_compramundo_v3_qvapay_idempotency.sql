create unique index if not exists cm_payment_intents_provider_idempotency_uidx
  on public.cm_payment_intents (provider, idempotency_key);
create unique index if not exists cm_provider_events_provider_event_uidx
  on public.cm_provider_events (provider, event_id);
