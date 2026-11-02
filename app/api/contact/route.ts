import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase-admin";
import { ratelimit } from "@/lib/ratelimit";

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Apufunktio bottien tuottamien satunnaisjonojen (gibberish) havaitsemiseen
function isGibberish(text: string): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  // Jos merkkijono on yli 15 merkkiä pitkä eikä sisällä yhtään välilyöntiä tai yhdysviivaa (tyypillinen bottien generoima sotku)
  if (trimmed.length > 15 && !trimmed.includes(" ") && !trimmed.includes("-")) {
    return true;
  }
  // Jos siinä on liikaa isoja kirjaimia ilman välilyöntejä
  const upperCount = (trimmed.match(/[A-Z]/g) || []).length;
  if (trimmed.length > 10 && upperCount / trimmed.length > 0.6) {
    return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message, website } = body;
    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      "Tuntematon";

    // 1. AJETAAN RATE LIMIT IHAN ENSIMMÄISEKSI
    const { success } = await ratelimit.limit(`contact_${ip}`);

    if (!success) {
      return NextResponse.json(
        { error: "Liikaa yrityksiä. Yritä myöhemmin uudelleen." },
        { status: 429 },
      );
    }

    // 2. TARKISTETAAN HONEYPOT
    if (website) {
      console.warn("Botti havaittu (honeypot):", {
        ip: ip,
        userAgent: req.headers.get("user-agent"),
        websiteValue: website,
      });
      return NextResponse.json({ success: true });
    }

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof subject !== "string" ||
      typeof message !== "string"
    ) {
      return NextResponse.json(
        { error: "Virheelliset tiedot." },
        { status: 400 },
      );
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      return NextResponse.json(
        { error: "Kaikki kentät ovat pakollisia." },
        { status: 400 },
      );
    }

    // 3. UUSI: TARKISTETAAN GIBBERISH (Estää esimerkkisi kaltaiset bottiviestit)
    if (isGibberish(trimmedName) || isGibberish(trimmedSubject)) {
      console.warn("Botti estetty (gibberish-suodatus):", { ip, name: trimmedName, subject: trimmedSubject });
      // Palautetaan hämäykseksi onnistuminen, jotta botti luulee viestin menneen läpi
      return NextResponse.json({ success: true });
    }

    if (trimmedName.length > 100) {
      return NextResponse.json({ error: "Nimi liian pitkä." }, { status: 400 });
    }

    if (trimmedSubject.length > 150) {
      return NextResponse.json(
        { error: "Aihe liian pitkä (max 150 merkkiä)." },
        { status: 400 },
      );
    }

    if (trimmedMessage.length > 5000) {
      return NextResponse.json(
        { error: "Viesti liian pitkä (max 5000 merkkiä)." },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Virheellinen sähköpostiosoite." },
        { status: 400 },
      );
    }

    // Tallennetaan tietokantaan
    const { data: savedMessage, error: dbError } = await admin
      .from("contact_messages")
      .insert({
        name: trimmedName,
        email: trimmedEmail,
        subject: trimmedSubject,
        message: trimmedMessage,
        ip_address: ip,
        user_agent: userAgent,
        referer,
        language,
        country,
        region,
        city,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB INSERT ERROR:", dbError);
      return NextResponse.json(
        { error: "Viestin tallennus epäonnistui." },
        { status: 500 },
      );
    }

    const recipientEmail = process.env.CONTACT_RECEIVER_EMAIL;

    if (!recipientEmail) {
      console.error("CONTACT_RECEIVER_EMAIL puuttuu.");
      return NextResponse.json({ success: true });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const admin = createAdminClient();

    const userAgent = req.headers.get("user-agent") ?? "Tuntematon";
    const referer = req.headers.get("referer") ?? "Ei refereriä";
    const language = req.headers.get("accept-language") ?? "Tuntematon";

    const country = req.headers.get("x-vercel-ip-country") ?? "Tuntematon";
    const region =
      req.headers.get("x-vercel-ip-country-region") ?? "Tuntematon";
    const city = req.headers.get("x-vercel-ip-city") ?? "Tuntematon";

    try {
      const { data, error } = await resend.emails.send({
        from: "Duunify <yhteydenotot@duunify.com>",
        to: recipientEmail,
        replyTo: trimmedEmail,
        subject: `Uusi yhteydenotto: ${trimmedSubject}`,
        html: `
    <div style="font-family:sans-serif;max-width:600px;line-height:1.5;">
      <h2 style="color:#1e293b;">Uusi yhteydenotto</h2>

      <p><strong>Nimi:</strong> ${escapeHtml(trimmedName)}</p>
      <p><strong>Sähköposti:</strong> ${escapeHtml(trimmedEmail)}</p>
      <p><strong>Aihe:</strong> ${escapeHtml(trimmedSubject)}</p>

      <p><strong>Viesti:</strong></p>
      <p style="white-space:pre-wrap;background:#f8fafc;padding:10px;border-left:4px solid #cbd5e1;">
        ${escapeHtml(trimmedMessage)}
      </p>

      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e2e8f0;color:#475569;font-size:0.85rem;">
        <p><strong>Tekniset tiedot:</strong></p>
        <ul style="list-style:none;padding:0;">
          <li><strong>Sijainti:</strong> ${city}, ${region}, ${country}</li>
          <li><strong>IP-osoite:</strong> ${ip}</li>
          <li><strong>Kieli:</strong> ${language}</li>
          <li><strong>Selain:</strong> ${userAgent}</li>
          <li><strong>Referer:</strong> ${referer}</li>
        </ul>
      </div>

      <small style="color:#64748b;display:block;margin-top:20px;">
        Lähetetty Duunifyn yhteydenottolomakkeesta.
      </small>
    </div>
  `,
      });

      if (error) {
        console.error("Resend error:", error);
        throw error;
      }

      await admin
        .from("contact_messages")
        .update({ email_sent: true })
        .eq("id", savedMessage.id);
    } catch (err) {
      console.error("EMAIL SEND ERROR:", err);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("CONTACT API ERROR:", err);
    return NextResponse.json(
      { error: "Odottamaton virhe." },
      { status: 500 },
    );
  }
}