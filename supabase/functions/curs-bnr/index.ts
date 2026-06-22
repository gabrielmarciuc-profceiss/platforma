// ============================================================================
// PROFCEISS - Edge Function "curs-bnr"
// ----------------------------------------------------------------------------
// Citeste cursul oficial EUR/RON direct de la BNR (server-side, deci fara CORS),
// il salveaza in tabelul public.curs_valutar si il returneaza ca JSON catre
// configuratorul fotovoltaic.
//
// Sursa oficiala: https://www.bnr.ro/nbrfxrates.xml
//
// Comportament:
//   - daca in tabel avem deja cursul de azi -> il returnam din tabel (rapid).
//   - daca lipseste sau e mai vechi de azi -> reluam de la BNR, salvam, returnam.
//   - daca BNR e indisponibil dar avem o valoare salvata -> o returnam (stale).
//
// Raspuns: { rate: number, date: string|null, source: 'BNR'|'cache', stale: bool }
//
// Deploy cu acces public (fara JWT) - vezi config.toml: verify_jwt = false.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BNR_URL = "https://www.bnr.ro/nbrfxrates.xml";

// Extrage cursul EUR si data din XML-ul BNR (parsare simpla cu regex - format fix).
async function fetchBnrEur(): Promise<{ rate: number; date: string | null }> {
  const res = await fetch(BNR_URL);
  if (!res.ok) throw new Error("BNR HTTP " + res.status);
  const xml = await res.text();

  const dateMatch = xml.match(/<Cube date="([^"]+)"/);
  const eurMatch = xml.match(/<Rate currency="EUR"[^>]*>([\d.]+)<\/Rate>/);
  if (!eurMatch) throw new Error("EUR negasit in feed-ul BNR");

  const rate = parseFloat(eurMatch[1]);
  const date = dateMatch ? dateMatch[1] : null;
  if (!(rate > 3 && rate < 8)) throw new Error("Curs EUR invalid: " + rate);

  return { rate, date };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // 1) Ce avem deja in tabel?
  const { data: stored } = await supabase
    .from("curs_valutar")
    .select("rate, data, updated_at")
    .eq("currency", "EUR")
    .maybeSingle();

  // 2) Avem deja cursul de azi -> il returnam direct.
  if (stored && (stored.data ?? "") >= today) {
    return json({ rate: Number(stored.rate), date: stored.data, source: "cache", stale: false });
  }

  // 3) Lipseste sau e vechi -> reluam de la BNR.
  try {
    const fresh = await fetchBnrEur();
    await supabase
      .from("curs_valutar")
      .upsert(
        { currency: "EUR", rate: fresh.rate, data: fresh.date, updated_at: new Date().toISOString() },
        { onConflict: "currency" },
      );
    return json({ rate: fresh.rate, date: fresh.date, source: "BNR", stale: false });
  } catch (e) {
    // BNR indisponibil -> daca avem o valoare salvata, o dam (marcata stale).
    if (stored) {
      return json({
        rate: Number(stored.rate),
        date: stored.data,
        source: "cache",
        stale: true,
        error: String(e),
      });
    }
    return json({ error: String(e) }, 502);
  }
});
