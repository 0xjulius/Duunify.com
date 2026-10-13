// TÄRKEÄÄ: tämä importti PITÄÄ olla ennen "pdf-parse":n tuontia.
import "pdf-parse/worker";

import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { anonymizeText } from "@/lib/anonymize";
import { createClient } from "@supabase/supabase-js";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 1. RATE LIMITER -ALUSTUS (Edellyttää UPSTASH_REDIS_REST_URL ja UPSTASH_REDIS_REST_TOKEN .env-tiedostossa)
const redis = Redis.fromEnv();
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"), // Max 5 pyyntöä per minuutti per IP
  analytics: true,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Luodaan Supabase-asiakas palvelinpään hakuja varten
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function fetchAndParseFile(
  userId: string,
  prefix: string,
  filename: string,
) {
  if (!userId || !filename) return "";

  try {
    const cleanFilename = filename.replace(new RegExp(`^${prefix}_`), "");
    const possiblePaths = [
      `${userId}/${filename}`,
      `${userId}/${prefix}_${cleanFilename}`,
      `${userId}/${cleanFilename}`,
    ];

    const uniquePaths = Array.from(new Set(possiblePaths));

    let fileData: Blob | null = null;
    let downloadError: any = null;
    let successfulPath = "";

    for (const storagePath of uniquePaths) {
      console.log(
        `[PDF DEBUG] Kokeillaan hakea tiedostoa polusta: ${storagePath}`,
      );
      const result = await supabaseAdmin.storage
        .from("documents")
        .download(storagePath);

      if (!result.error && result.data) {
        fileData = result.data;
        downloadError = null;
        successfulPath = storagePath;
        break;
      } else {
        downloadError = result.error;
      }
    }

    if (!downloadError && fileData) {
      console.log(`✅ Tiedosto LÖYTYI polusta: ${successfulPath}`);

      if (fileData.size > 500 * 1024) {
        console.error(
          `❌ Tiedosto ${filename} ylittää 500 KB kokorajan (${Math.round(fileData.size / 1024)} KB)`,
        );
        return "";
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());

      if (filename.toLowerCase().endsWith(".pdf")) {
        console.log(
          `[PDF DEBUG] Aloitetaan PDF-tiedoston (${filename}) parsinta...`,
        );
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: buffer });

        try {
          const parsedPdf = await parser.getText();
          console.log(
            `✅ Tiedosto ${filename} PARSITTU ONNISTUNEESTI! (${parsedPdf.text.length} merkkiä)`,
          );
          return parsedPdf.text;
        } finally {
          await parser.destroy();
        }
      } else {
        console.log(`✅ Tekstitiedosto ${filename} LUETTU ONNISTUNEESTI!`);
        return buffer.toString("utf-8");
      }
    } else {
      console.error(
        `❌ Tiedoston ${filename} lataus epäonnistui kaikista kokeilluista poluista:`,
        uniquePaths,
      );
    }
  } catch (fileErr) {
    console.error(
      `❌ Virhe tiedoston ${filename} käsittelyssä/parsinnassa:`,
      fileErr,
    );
  }
  return "";
}

export async function POST(req: Request) {
  try {
    // 2. RATE LIMITING -TARKISTUS
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const { success } = await ratelimit.limit(`generate_cover_letter_${ip}`);
      if (!success) {
        return NextResponse.json(
          {
            error:
              "Olet tehnyt liian monta pyyntöä lyhyen ajan sisällä. Odota hetki ja yritä uudelleen.",
          },
          { status: 429 },
        );
      }
    }

    // 3. KÄYTTÄJÄN AUTH-TARKISTUS
    const authHeader = req.headers.get("Authorization");
    let authenticatedUserId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser(token);
      if (user) {
        authenticatedUserId = user.id;
      }
    }

    const body = await req.json();
    const {
      jobTitle,
      company,
      jobDescription,
      job_description,
      userBaseCoverLetter,
      userId: bodyUserId,
      userName,
      location = "Paikkakunta",
    } = body;

    // ensisijaisesti käytetään todennettua id:tä turvallisuuden vuoksi
    const userId = authenticatedUserId || bodyUserId;

    if (!userId) {
      return NextResponse.json(
        { error: "Käyttäjää ei tunnistettu. Kirjaudu sisään uudelleen." },
        { status: 401 },
      );
    }

    // 4. KREDIITTIEIDEN TARKISTUS JA VÄHENNYS (RPC) ENNEN ILMOITUKSEN LUONTIA
    const { data: creditSuccess, error: creditError } = await supabaseAdmin.rpc(
      "use_ai_credit",
      { target_user_id: userId },
    );

    if (creditError) {
      console.error("Virhe krediittien tarkistuksessa:", creditError);
      return NextResponse.json(
        { error: "Krediittien tarkistus epäonnistui tietokannassa." },
        { status: 500 },
      );
    }

    // JOS KREDIITIT OVAT LOPUSSA, EI LUODA "KREDIITTI KÄYTETTY" -ILMOITUSTA
    if (!creditSuccess) {
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        title: "AI-krediitit loppuneet",
        message: "Saatekirjeen luonti epäonnistui, koska AI-krediittisi ovat loppu.",
        type: "warning",
        read: false,
      });

      return NextResponse.json(
        {
          error: "AI-krediittisi ovat loppuneet! Lataa lisää krediittejä jatkaaksesi.",
        },
        { status: 403 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API-avain puuttuu konfiguraatiosta." },
        { status: 500 },
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const rawJobDescription = jobDescription || job_description || "";

    let letterFilename = body.letterFilename;
    let cvFilename = body.cvFilename;

    // 5. HAETAAN TIEDOSTOJEN NIMET PROFILES-TAULUSTA
    if (!letterFilename || !cvFilename) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("cv_filename, letter_filename")
        .eq("id", userId)
        .single();

      if (profile) {
        cvFilename = cvFilename || profile.cv_filename;
        letterFilename = letterFilename || profile.letter_filename;
      }
    }

    // 6. HAETAAN JA PARSITAAN SEKÄ CV ETTÄ HAKUKIRJE
    const extractedCvText = await fetchAndParseFile(userId, "cv", cvFilename);
    const extractedLetterText = await fetchAndParseFile(
      userId,
      "letter",
      letterFilename,
    );

    const combinedBaseText = [
      extractedCvText ? `--- CV TEKSTI ---\n${extractedCvText}` : "",
      extractedLetterText
        ? `--- Aiempi SAATEKIRJE ---\n${extractedLetterText}`
        : "",
      userBaseCoverLetter
        ? `--- MUUT TAUSTATIEDOT ---\n${userBaseCoverLetter}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    // 7. ANONYMISOINTI
    const safeBaseCoverLetter = anonymizeText(combinedBaseText, userName);
    const safeJobDescription = anonymizeText(rawJobDescription);

    const prompt = `
Olet huipputason uravalmentaja ja rekrytointiasiantuntija. Tehtäväsi on kirjoittaa erittäin laadukas, uskottava ja tarkasti kyseiseen työtehtävään kohdennettu työhakemus.

LÄHTÖTIEDOT:
TYÖPAIKKAILMOITUS:
- Tehtävänimike: ${jobTitle}
- Yritys: ${company}
- Kuvaus: ${safeJobDescription || "Ei erillistä kuvausta"}

HAKIJAN POHJASAATEKIRJE / CV / TAUSTATIEDOT:
${safeBaseCoverLetter || "Hakijalla on vahva perusosaaminen ja motivaatio kehittyä alalla."}

---

ANALYYSI JA TAUSTAOHJEET (Noudata näitä sisäisesti):
1. Tunnista työpaikkailmoituksesta tärkeimmät vastuut sekä mitä osaamista työnantaja todellisuudessa etsii.
2. Yhdistä hakijan tausta (CV ja aiempi kokemus) suoraan näihin tarpeisiin ja korosta konkreettista hyötyä työnantajalle.
3. REHELLISYYS: Älä KOSKAAN keksi hakijalle työkokemusta, taitoja, sertifikaatteja tai koulutusta, joita ei ole mainittu taustatiedoissa. Käsittele puuttuva kokemus oppimiskyvyn ja vahvan perustan kautta. Älä yritä tehdä juniorista senioria.
4. TYYLI: Kirjoita ammattimaisesti, luonnollisesti ja itsevarman realistisesti. Vältä tyhjiä adjektiiveja (esim. passionate, motivated, hardworking, excellent), ellei niitä perustella konkreettisin näytöin. Tekstin tulee kuulostaa ajattelevan ihmisen – ei tekoälyn – kirjoittamalta. Tämä vaatii täydellistä ja idiomaattista suomen kielen hallintaa ilman englannista kopioituja lauserakenteita (anglismeja).
5. KIELIASU, KIELIOPPI JA OCR-KORJAUS: Korjaa automaattisesti kaikki syötemateriaalissa (CV/saatekirje) olevat ilmeiset kirjoitus-, lyönti- ja tekstinparsintavirheet (esim. muuta "konomi" muotoon "merkonomi"). Varmista, että suomen kielen taivutusmuodot, yhdyssanat ja kurssien nimet ovat täysin virheettömiä. KIINNITÄ ERITYISTÄ HUOMIOTA REKTIOIHIN JA VERBIEN KÄYTTÖÖN: Varmista verbien transitiivisuus (esim. älä koskaan kirjoita "olen kertynyt kokemusta", vaan oikeaoppisesti "minulle on kertynyt kokemusta" tai "olen kerryttänyt/kerännyt kokemusta"). Tekstin on oltava kieliopillisesti virheetöntä ammattisuomea.

---

HAKEMUKSEN RAKENNE JA SISÄLTÖ (Kirjoita osiot TÄSMÄLLEEN tässä järjestyksessä):

1. ALOITUS RIVI RIVILTÄ:
   - Kirjoita aloitustiedot täsmälleen näin:

   **${jobTitle}**

   ${company}, ${location}

2. JOHDANTO (Mene suoraan asiaan ilman selittelyä tai metapuhetta):
   - Ensimmäinen virke ilmoittaa suoraan ja konstailematta haettavan tehtävän.
   - Sitä seuraavat 2-3 lausetta kytkevät hakijan taustan suoraan tehtävän keskeisimpään vaatimukseen. Älä selitä "miksi kiinnostuit", vaan kerro mitä tuot mukanasi.

3. KOULUTUS:
   - Käytä otsikkona täsmälleen Markdown-muotoa: ## Koulutus
   - Kuvaa koulutusta työn kannalta relevantista näkökulmasta (mitä osaamista se on tuonut ja miten se tukee tehtävää).
   - Älä unohda koulutustaustaa, vaikka se ei olisi suoraan tehtävän vaatimaa, vaan kerro siitä silti. Keksi miten se tarjoaa arvoa yritykselle ja tukee soveltuvuutta.
   - ÄLÄ LUETTELE YKSITTÄISTEN KURSSIEN TAI SERTIFIKAATTIEN NIMIÄ (kuten Elements of AI, Azure Fundamentals jne.).
   - Käytä kurssinimien sijaan AINOASTAAN geneerisiä teema-ilmaisuja (esim. "tekoälyyn, pilvipalveluihin ja tietoturvaan liittyviä kursseja" tai "alaan liittyviä sertifikaatteja").

4. TYÖKOKEMUS JA KÄYTÄNNÖN OSAAMINEN:
   - Käytä otsikkona täsmälleen Markdown-muotoa: ## Työkokemus ja käytännön osaaminen
   - Yhdistä aiempi kokemus uuden tehtävän vaatimuksiin.
   - Kerro mitä hyötyä aiemmasta kokemuksesta on uudessa roolissa.
   - Älä mainitse yritysten nimiä, vaan käytä geneerisiä ilmaisuja (esim. "kansainvälinen ohjelmistoyritys", "pienyritys", "startup", "julkinen organisaatio").

5. SOVELTUVUUS TEHTÄVÄÄN:
   - Käytä otsikkona täsmälleen Markdown-muotoa: ## Miksi koen olevani sopiva tähän tehtävään?
   - Luo selkeä lista, jossa on 6 kohdan Markdown-bullet-listaus (käytä viivaa - ).
   - Jokaisen kohdan ALUSSA on OMA ERILLINEN RIVINSÄ. Älä yhdistä kohtia samalle riville tai käytä palluroita (•) tekstin seassa.
   - ÄLÄ LUETTELE YKSITTÄISTEN KURSSIEN TAI SERTIFIKAATTIEN NIMIÄ (esim. Elements of AI, Azure jne.). Käytä vain yleisiä teemailmaisuja (esim. "tietoturva- ja tekoälyopinnot" tai "pilvipalvelusertifikaatit").
   - Muotoile jokainen kohta TÄSMÄLLEEN näin (huomioi viiva ja boldaus):

   - **Otsikko boldattuna:** Tähän tulee tiivis selitys siitä, mitä hyötyä tästä on työnantajalle.

   - **Toinen otsikko boldattuna:** Tähän tulee seuraava selitys.

6. LOPETUS:
   - Tiivis ja vahva päätöskappale (max 3-4 lausetta). Kokoa tärkeimmät vahvuudet, vahvista kiinnostus ja ilmaise valmius tulla haastatteluun.
   - ÄLÄ kirjoita lopputervehdyksiä ("Ystävällisin terveisin"), kiitoksia ("Kiitos ajastanne") tai yhteystietoja/allekirjoitusta. Hakemus päättyy suoraan tekstikappaleeseen.

---

EHDOTON SÄÄNTÖ:
1. Palauta VASTAUKSEKSI AINOASTAAN valmis työhakemusteksti. Älä kirjoita tekstiin tai sen alkuun/loppuun minkäänlaisia johdantoja, terveisiä, selityksiä, kommentteja tai "Tässä on hakemuksesi" -tyyppisiä lauseita.
2. AJATUSVIIVOJEN KIELTO: Tekstissä EI SAA esiintyä yhtäkään ajatusviivaa (– / —). Käytä vain normaaleja välimerkkejä, kuten pilkkuja ja pisteitä.
3. Älä vähättele hakijan osaamista. Älä käytä sanoja kuten "juniori", "perusosaaminen" tai "vähän kokemusta". Keskity siihen, mitä hakija osaa ja mitä hyötyä siitä on työnantajalle.
`;

    // 8. GEMINI-KUTSU
    let response;
    let usedModel = "gemini-3.5-flash";

    try {
      response = await ai.models.generateContent({
        model: usedModel,
        contents: prompt,
      });
    } catch (primaryError: any) {
      console.warn(
        `Ensisijainen malli (${usedModel}) epäonnistui, yritetään varamallia...`,
        primaryError?.message,
      );

      usedModel = "gemini-3.5-flash-lite";
      try {
        response = await ai.models.generateContent({
          model: usedModel,
          contents: prompt,
        });
      } catch (fallbackError: any) {
        throw fallbackError;
      }
    }

    // 9. LISÄTÄÄN ONNISTUNUT ILMOITUS VAIN KUN GENEROINTI ON VALMIS
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: "AI-krediitti käytetty",
      message: `Saatekirje luotu kohteelle ${jobTitle} (${company}). Jäljellä olevat krediitit päivitetty.`,
      type: "success",
      read: false,
    });

    return NextResponse.json({ coverLetter: response.text });
  } catch (error: any) {
    console.error("Gemini API backend virhe:", error);

    if (error?.status === 429 || error?.message?.includes("quota")) {
      return NextResponse.json(
        {
          error:
            "Palvelussa on tilapäistä ruuhkaa (kiintiöraja saavutettu). Odota 30 sekuntia ja yritä uudelleen.",
        },
        { status: 429 },
      );
    }

    return NextResponse.json(
      {
        error:
          error?.message || "Saatekirjeen generointi epäonnistui palvelimella.",
      },
      { status: 500 },
    );
  }
}