import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TZ = "Europe/Helsinki";
const CAL_NAME = "Duunify – työnhaku";
const DEFAULT_DURATION_MIN = 60;

const TYPE_LABELS: Record<string, string> = {
  deadline: "Hakuaika päättyy",
  interview: "Haastattelu",
  reminder: "Muistutus",
  other: "Muu",
};

type FeedEvent = {
  uid: string;
  title: string;
  description?: string;
  category?: string;
  /** YYYYMMDD */
  date: string;
  /** HH:MM tai null = koko päivän tapahtuma */
  time: string | null;
  /** Muistutus: koko päivän tapahtumalle edellisenä päivänä klo 9, muuten ennen alkua */
  alarm?: boolean;
  alarmTrigger?: string;
};

// Service role ohittaa RLS:n, koska tilaaja (iPhone) ei ole kirjautunut sisään.
// Käytetään vain palvelimella. Älä koskaan lisää NEXT_PUBLIC_-etuliitettä avaimeen.
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ---------- ICS-apurit (RFC 5545) ----------

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Rivit saavat olla enintään 75 tavua; jatkorivit alkavat välilyönnillä. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let bytes = 0;

  for (const ch of line) {
    const len = encoder.encode(ch).length;
    if (bytes + len > 75) {
      parts.push(current);
      current = " ";
      bytes = 1;
    }
    current += ch;
    bytes += len;
  }
  parts.push(current);
  return parts.join("\r\n");
}

function icsStamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Muuntaa tietokannan päivämäärämerkkijonon muotoon YYYYMMDD.
 * - "2026-11-30"                  -> 20261130
 * - "2026-11-30T00:00:00"         -> 20261130 (ei aikavyöhykettä: otetaan päivä sellaisenaan)
 * - "2026-11-30T21:59:00+00:00"   -> muunnetaan Suomen ajaksi
 */
function toIcsDay(value: string): string | null {
  const hasOffset =
    value.includes("T") && /(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(value);

  if (hasOffset) {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("sv-SE", { timeZone: TZ }).replace(/-/g, "");
  }

  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}${m[2]}${m[3]}` : null;
}

/** Palauttaa päivän jälkeisen päivän (YYYYMMDD). */
function nextDay(yyyymmdd: string): string {
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  return new Date(Date.UTC(y, m - 1, d + 1))
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");
}

/** Lisää minuutteja "kellumattomaan" paikalliseen aikaan -> YYYYMMDDTHHMMSS */
function addMinutes(yyyymmdd: string, hhmm: string, minutes: number): string {
  const y = Number(yyyymmdd.slice(0, 4));
  const mo = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  const [h, mi] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(y, mo - 1, d, h, mi + minutes))
    .toISOString()
    .slice(0, 19)
    .replace(/[-:]/g, "");
}

function buildIcs(events: FeedEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Duunify//Kalenteri//FI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(CAL_NAME)}`,
    `X-WR-TIMEZONE:${TZ}`,
    // Vihjeitä tilaajalle; iOS päättää todellisen päivitysvälin itse
    "REFRESH-INTERVAL;VALUE=DURATION:PT15M",
    "X-PUBLISHED-TTL:PT15M",
  ];

  const stamp = icsStamp();

  for (const ev of events) {
    lines.push("BEGIN:VEVENT", `UID:${ev.uid}`, `DTSTAMP:${stamp}`);

    if (ev.time) {
      // Kellonaika "kelluvana" paikallisaikana, kuten sovelluksessakin
      // (selain tulkitsee ajan laitteen aikavyöhykkeessä).
      lines.push(
        `DTSTART:${ev.date}T${ev.time.replace(":", "")}00`,
        `DTEND:${addMinutes(ev.date, ev.time, DEFAULT_DURATION_MIN)}`,
      );
    } else {
      lines.push(
        `DTSTART;VALUE=DATE:${ev.date}`,
        `DTEND;VALUE=DATE:${nextDay(ev.date)}`,
        "TRANSP:TRANSPARENT",
      );
    }

    lines.push(`SUMMARY:${escapeText(ev.title)}`);
    if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`);
    if (ev.category) lines.push(`CATEGORIES:${escapeText(ev.category)}`);

    if (ev.alarm) {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeText(ev.title)}`,
        `TRIGGER:${ev.alarmTrigger ?? (ev.time ? "-PT30M" : "-PT15H")}`,
        "END:VALARM",
      );
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

// ---------- Reitti ----------

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token: rawToken } = await ctx.params;
  const token = rawToken.replace(/\.ics$/i, "");

  // Hylkää heti kaikki, mikä ei näytä tokenilta
  if (!/^[a-f0-9]{32,128}$/i.test(token)) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[calendar-feed] SUPABASE_SERVICE_ROLE_KEY puuttuu");
    return new NextResponse("Server misconfigured", { status: 500 });
  }

  const db = adminClient();

  const { data: feed, error: feedError } = await db
    .from("calendar_feeds")
    .select("user_id")
    .eq("token", token)
    .maybeSingle();

  if (feedError) {
    // Esim. väärä avain (anon-avain service role -avaimen tilalla) tai puuttuva taulu
    console.error("[calendar-feed] Tokenin haku epäonnistui:", feedError.message);
    return new NextResponse("Internal error", { status: 500 });
  }

  if (!feed) {
    console.warn("[calendar-feed] Tuntematon token");
    return new NextResponse("Not found", { status: 404 });
  }

  const userId = feed.user_id as string;

  const [appsRes, customRes] = await Promise.all([
    db
      .from("applications")
      .select("id, company, job_title, valid_through, status")
      .eq("user_id", userId),
    db
      .from("calendar_events")
      .select(
        "id, type, title, event_date, event_time, notes, application_id, completed",
      )
      .eq("user_id", userId),
  ]);

  if (appsRes.error || customRes.error) {
    console.error(
      "[calendar-feed] Tietokantavirhe:",
      appsRes.error?.message || customRes.error?.message,
    );
    return new NextResponse("Internal error", { status: 500 });
  }

  const applications = appsRes.data ?? [];
  const appById = new Map(applications.map((a) => [a.id, a]));
  const events: FeedEvent[] = [];

  // 1. Hakuajan päättymiset (sama logiikka kuin buildUnifiedEvents:ssa)
  for (const a of applications) {
    if (!a.valid_through || a.status === "Hylätty") continue;

    const day = toIcsDay(a.valid_through);
    if (!day) continue;

    const status = (a.status ?? "").toLowerCase();
    const applied = status === "haettu" || status === "haastattelu";

    events.push({
      uid: `deadline-${a.id}@duunify`,
      title: `Hakuaika päättyy${applied ? " (Haettu ✓)" : ""}: ${a.company} – ${a.job_title}`,
      description: `${a.company} · ${a.job_title}\nTila: ${a.status ?? "-"}`,
      category: TYPE_LABELS.deadline,
      date: day,
      time: null,
      // Muistutus vain, jos paikkaa ei ole vielä haettu
      alarm: status === "tallennettu",
    });
  }

  // 2. Omat kalenteritapahtumat
  for (const e of customRes.data ?? []) {
    if (!e.event_date) continue;

    const day = toIcsDay(String(e.event_date));
    if (!day) continue;

    const time = e.event_time ? String(e.event_time).slice(0, 5) : null;
    const app = e.application_id ? appById.get(e.application_id) : undefined;

    const descriptionParts = [
      app ? `${app.company} · ${app.job_title}` : null,
      e.notes || null,
    ].filter(Boolean) as string[];

    events.push({
      uid: `event-${e.id}@duunify`,
      title: `${e.completed ? "✓ " : ""}${e.title}`,
      description: descriptionParts.join("\n") || undefined,
      category: TYPE_LABELS[e.type] ?? TYPE_LABELS.other,
      date: day,
      time,
      alarm: !e.completed,
      alarmTrigger: e.type === "interview" && time ? "-PT60M" : undefined,
    });
  }

  return new NextResponse(buildIcs(events), {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="duunify.ics"',
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}