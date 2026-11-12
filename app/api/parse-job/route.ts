import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { ratelimit } from "../../../lib/ratelimit";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const preferredRegion = ["arn1"];
export const dynamic = "force-dynamic";
export const maxDuration = 60; // Estää Verceliä katkaisemasta pyyntöä liian aikaisin

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
];

function isAllowedJobSite(url: string) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const allowedDomains = [
      "duunitori.fi",
      "tyomarkkinatori.fi",
      "jobly.fi",
      "academicwork.fi",
    ];

    return allowedDomains.some(
      (domain) => hostname === domain || hostname.endsWith("." + domain)
    );
  } catch {
    return false;
  }
}

function suomennaTyoaika(tyyppiInput: any): string {
  if (!tyyppiInput) return "Ei määritelty";

  let tyypit: string[] = [];
  if (Array.isArray(tyyppiInput)) {
    tyypit = tyyppiInput.map((t) => String(t).trim().toUpperCase());
  } else {
    tyypit = String(tyyppiInput)
      .split(",")
      .map((t) => t.trim().toUpperCase());
  }

  const uniikitTyypit = [
    ...new Set(tyypit.filter((t) => t !== "OTHER" && t !== "")),
  ];

  if (uniikitTyypit.length === 1 && uniikitTyypit[0] === "FULL_TIME") {
    return "Kokoaikainen";
  }

  const kaannokset: Record<string, string> = {
    FULL_TIME: "Kokoaikainen",
    PART_TIME: "Osa-aikainen",
    TEMPORARY: "Määräaikainen",
    CONTRACT: "Projekti / Sopimustyö",
  };

  if (uniikitTyypit.length > 0) {
    return uniikitTyypit.map((t) => kaannokset[t] || t).join(", ");
  }

  const textVal = String(tyyppiInput).toLowerCase();
  if (textVal.includes("kokoaikainen") || textVal.includes("full_time") || textVal.includes("full-time")) {
    return "Kokoaikainen";
  }
  if (textVal.includes("osa-aikainen") || textVal.includes("part_time") || textVal.includes("part-time")) {
    return "Osa-aikainen";
  }

  return String(tyyppiInput);
}

function cleanDescription(rawHtml: string, isAcademicWork: boolean = false): string {
  if (!rawHtml) return "";
  
  let cleaned = rawHtml
    .replace(/\\n/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<(b|strong)[^>]*>/gi, "**")
    .replace(/<\/(b|strong)>/gi, "**")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .split("\n")
    .map((line: string) => line.trim().replace(/^[-*]\s+/, "• "))
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (isAcademicWork) {
    const cutOffPhrases = [
      "Tule osaksi Academic Workin",
      "Onko sinulla kysyttävää tästä työpaikasta",
      "Our recruitment process",
      "Tämä rekrytointiprosessi",
    ];

    for (const phrase of cutOffPhrases) {
      const idx = cleaned.indexOf(phrase);
      if (idx !== -1) {
        cleaned = cleaned.substring(0, idx).trim();
      }
    }
  }

  return cleaned.slice(0, 15000);
}

async function fetchJobHtml(targetUrl: string): Promise<string> {
  const scraperApiKey = process.env.SCRAPER_API_KEY;
  const isVercel = process.env.VERCEL === "1";

  if (scraperApiKey && targetUrl.includes("jobly.fi") && isVercel) {
    const scraperUrl = `https://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(
      targetUrl
    )}&render=true`;

    const res = await fetch(scraperUrl, {
      headers: {
        "Accept-Language": "fi-FI,fi;q=0.9,en;q=0.8",
      },
    });

    if (!res.ok) {
      throw new Error(`ScraperAPI palautti virheen: ${res.status}`);
    }

    return await res.text();
  }

  let browser = null;

  try {
    if (isVercel) {
      const executablePath = await chromium.executablePath();
      browser = await puppeteer.launch({
        args: [
          ...chromium.args,
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
        defaultViewport: { width: 1280, height: 720 },
        executablePath,
        headless: true,
      });
    } else {
      const puppeteerModule = await import("puppeteer");
      const localPuppeteer = puppeteerModule.default || puppeteerModule;

      browser = await localPuppeteer.launch({
        headless: true,
        defaultViewport: { width: 1280, height: 720 },
      });
    }

    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENTS[0]);

    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });

    await page.waitForSelector("h1", { timeout: 8000 }).catch(() => {});

    return await page.content();
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { success } = await ratelimit.limit(user.id);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await req.json();
    if (typeof body.url !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const url = body.url.trim();
    if (!url || !isAllowedJobSite(url)) {
      return NextResponse.json(
        { error: "Unsupported or missing URL" },
        { status: 400 }
      );
    }

    let html = "";
    if (url.includes("jobly.fi") || url.includes("academicwork.fi")) {
      try {
        html = await fetchJobHtml(url);
      } catch (err: any) {
        console.error("Browser fetch error:", err);
        return NextResponse.json(
          { error: "Failed to fetch job ad page" },
          { status: 502 }
        );
      }
    } else {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const randomUserAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

      let response: Response;
      try {
        response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": randomUserAgent,
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "fi-FI,fi;q=0.9,en;q=0.8",
          },
        });
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        return NextResponse.json(
          { error: `Site returned ${response.status}` },
          { status: 502 }
        );
      }
      html = await response.text();
    }

    const $ = cheerio.load(html);
    const isAcademicWork = url.includes("academicwork.fi");
    let jobData: any = null;

    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const content = $(element).html();
        if (!content) return;
        const parsed = JSON.parse(content);

        const findJobPosting = (item: any): any => {
          if (!item) return null;
          const type = item["@type"];
          const isJobPosting =
            type === "JobPosting" ||
            (Array.isArray(type) && type.includes("JobPosting"));

          if (isJobPosting) return item;

          if (Array.isArray(item)) {
            for (const subItem of item) {
              const found = findJobPosting(subItem);
              if (found) return found;
            }
          }
          if (item["@graph"] && Array.isArray(item["@graph"])) {
            for (const subItem of item["@graph"]) {
              const found = findJobPosting(subItem);
              if (found) return found;
            }
          }
          return null;
        };

        const foundJob = findJobPosting(parsed);
        if (foundJob) {
          jobData = foundJob;
        }
      } catch {}
    });

    // 1. Title (Otsikko)
    const rawTitle =
      jobData?.title ||
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content")?.split("|")[0]?.trim() ||
      $("title").text().trim();

    const title = rawTitle
      ? rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1)
      : "";

    // 2. Company (Yritys)
    let rawCompany =
      jobData?.hiringOrganization?.name?.trim() ||
      $(".job-title h2").first().text().trim() ||
      $('meta[property="og:site_name"]').attr("content") ||
      "";

    if (isAcademicWork && (!rawCompany || rawCompany === "Academic Work")) {
      const parts = rawTitle.split(",").map((p: string) => p.trim());
      if (parts.length >= 2) {
        rawCompany = parts[1];
      } else {
        rawCompany = "Academic Work";
      }
    }

    const company = rawCompany
      ? rawCompany.charAt(0).toUpperCase() + rawCompany.slice(1)
      : "";

    // 3. Company Logo
    const logoData = jobData?.hiringOrganization?.logo;
    let companyLogo = null;
    if (typeof logoData === "object" && logoData !== null) {
      companyLogo = logoData?.url || logoData?.contentUrl || null;
    } else if (typeof logoData === "string") {
      companyLogo = logoData;
    }
    if (!companyLogo) {
      companyLogo =
        $('meta[property="og:image"]').attr("content") ||
        $(".employer-logo img, .company-logo img").first().attr("src") ||
        null;
    }

    // 4. Location (Sijainti)
    let location = "";
    if (jobData?.jobLocation) {
      if (Array.isArray(jobData.jobLocation)) {
        location = jobData.jobLocation
          .map((loc: any) => {
            if (typeof loc === "string") return loc;
            return (
              loc?.address?.addressLocality ||
              loc?.address?.addressRegion ||
              loc?.address?.streetAddress ||
              ""
            );
          })
          .filter(Boolean)
          .join(", ");
      } else if (typeof jobData.jobLocation === "string") {
        location = jobData.jobLocation;
      } else {
        location =
          jobData.jobLocation?.address?.addressLocality ||
          jobData.jobLocation?.address?.addressRegion ||
          jobData.jobLocation?.address?.streetAddress ||
          "";
      }
    }

    if (!location && isAcademicWork) {
      const parts = rawTitle.split(",").map((p: string) => p.trim());
      if (parts.length >= 3) {
        location = parts[parts.length - 1];
      } else {
        const bodyText = $("main").text();
        const locMatch = bodyText.match(/Location:\s*([^\n]+)/i);
        if (locMatch && locMatch[1]) {
          location = locMatch[1].trim();
        }
      }
    }

    // 5. & 6. Salary Min & Max
    let salaryMin: number | null = null;
    let salaryMax: number | null = null;

    if (jobData?.baseSalary?.value) {
      const val = jobData.baseSalary.value;
      if (typeof val === "object") {
        salaryMin = val.minValue !== undefined ? Number(val.minValue) : null;
        salaryMax = val.maxValue !== undefined ? Number(val.maxValue) : null;
        if (salaryMin === null && val.value !== undefined) {
          salaryMin = Number(val.value);
        }
      } else if (typeof val === "number") {
        salaryMin = val;
      }
    }

    // 7. Employment Type (Työaika)
    let rawEmploymentType =
      jobData?.employmentType ||
      $(".job-type, [data-testid='job-type']").first().text().trim() ||
      "";

    if (!rawEmploymentType && isAcademicWork) {
      const bodyText = $("main").text().toLowerCase();
      if (bodyText.includes("kokoaikainen") || bodyText.includes("full-time") || bodyText.includes("full time")) {
        rawEmploymentType = "FULL_TIME";
      } else if (bodyText.includes("osa-aikainen") || bodyText.includes("part-time")) {
        rawEmploymentType = "PART_TIME";
      }
    }
    const employmentType = suomennaTyoaika(rawEmploymentType);

    // 8. Valid Through & Date Posted
    const validThrough = jobData?.validThrough || "";
    const datePosted = jobData?.datePosted || "";

    // 10. Description (Kuvaus)
    let rawDescription =
      jobData?.description ||
      $(".job-description").html() ||
      "";

    if (!rawDescription && isAcademicWork) {
      const mainClone = $("main").clone();
      mainClone.find("button, nav, header, footer, script, style, form").remove();
      rawDescription = mainClone.html() || "";
    }

    if (!rawDescription) {
      rawDescription = $('meta[property="og:description"]').attr("content") || "";
    }

    const description = cleanDescription(rawDescription, isAcademicWork);

    if (!title && !description) {
      return NextResponse.json(
        { error: "JobPosting data not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      title,
      company,
      companyLogo,
      location,
      description,
      salaryMin,
      salaryMax,
      employmentType,
      validThrough,
      datePosted,
    });
  } catch (error: any) {
    console.error("Route error:", error?.message || error);
    if (error?.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout while fetching job ad" },
        { status: 408 }
      );
    }
    return NextResponse.json({ error: "Parsing failed" }, { status: 500 });
  }
}