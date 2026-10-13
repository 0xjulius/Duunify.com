"use client";

import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ArrowLeft, CheckCircle2, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner"; // Tuodaan sonner

import { StepIndicator } from "@/components/job-assistant/StepIndicator";
import { ResultHeader, JobDetail } from "@/components/job-assistant/id/result/ResultHeader";
import { CoverLetterCard } from "@/components/job-assistant/id/result/CoverLetterCard";
import { ResultSidebar } from "@/components/job-assistant/id/result/ResultSidebar";

export default function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [generatedLetter, setGeneratedLetter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    async function loadDataAndGenerate() {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        let profileData = null;
        if (user) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("full_name, location, phone_number, email, letter_filename, cv_filename")
            .eq("id", user.id)
            .maybeSingle();

          if (profileError) console.error("Virhe profiilin haussa:", profileError);
          else profileData = profile;
        }

        const { data: jobData, error: jobError } = await supabase
          .from("applications")
          .select("*")
          .eq("id", jobId)
          .single();

        if (jobError || !jobData) {
          console.error("Virhe työpaikan haussa:", jobError);
          setError("Työpaikan tietoja ei löytynyt tietokannasta.");
          setLoading(false);
          return;
        }

        const fullName = profileData?.full_name || "Etunimi Sukunimi";
        const city = profileData?.location || "Paikkakunta";
        const phone = profileData?.phone_number || "Puhelinnumero";
        const email = profileData?.email || user?.email || "Sähköposti";

        const combinedData: JobDetail = {
          ...jobData,
          full_name: fullName,
          city,
          phone,
          email,
        };

        setJob(combinedData);
        setEditFullName(fullName);
        setEditCity(city);
        setEditPhone(phone);
        setEditEmail(email);
        setLoading(false);

        const existingLetter = jobData.cover_letter;
        if (existingLetter) {
          setGeneratedLetter(existingLetter);
        } else {
          await generateLetterWithGemini(combinedData, true);
        }
      } catch (err: any) {
        console.error("Alustusvirhe:", err);
        setError("Tietojen lataaminen epäonnistui.");
        setLoading(false);
      }
    }

    if (jobId) {
      loadDataAndGenerate();
    }
  }, [jobId]);

  async function generateLetterWithGemini(currentJob: JobDetail, isNewGeneration = false) {
    setGenerating(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let letterFilename = null;
    let cvFilename = null;

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("letter_filename, cv_filename")
        .eq("id", user.id)
        .maybeSingle();

      letterFilename = profile?.letter_filename;
      cvFilename = profile?.cv_filename;
    }

    if (isNewGeneration) {
      const { error: clearError } = await supabase
        .from("applications")
        .update({ cover_letter: null })
        .eq("id", currentJob.id);

      if (clearError) {
        console.error("Vanhan kirjeen poisto epäonnistui tietokannasta:", clearError);
      }
    }

    try {
      const jobLocation = currentJob.location || currentJob.city || "Paikkakunta";

      const res = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle: currentJob.job_title,
          company: currentJob.company,
          location: jobLocation,
          jobDescription: currentJob.job_description || "",
          userId: user?.id,
          cvFilename: cvFilename,
          letterFilename: letterFilename,
          userName: currentJob.full_name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generointi epäonnistui.");
      }

      const letterResult = data.coverLetter || data.letter || data.text;

      if (letterResult) {
        setGeneratedLetter(letterResult);

        await supabase
          .from("applications")
          .update({ cover_letter: letterResult })
          .eq("id", currentJob.id);

        // Päivitetään yläpalkin krediitit eventillä
        window.dispatchEvent(new Event("ai-credits-updated"));

        // SONNER TOAST: Onnistunut krediitin kulutus
        toast.success("Saatekirje luotu! 1 AI-krediitti käytetty.");
      } else {
        throw new Error("API ei palauttanut tekstiä.");
      }
    } catch (e: any) {
      console.error("Generointivirhe:", e);
      setError(e.message || "Saatekirjeen luominen epäonnistui.");
      
      // SONNER TOAST: Virhetilanne (esim. krediitit loppu)
      toast.error(e.message || "Saatekirjeen luominen epäonnistui.");
    } finally {
      setGenerating(false);
    }
  }

  async function deleteCoverLetter() {
    if (!job) return;

    const confirmDelete = window.confirm("Haluatko varmasti poistaa tämän saatekirjeen tietokannasta?");
    if (!confirmDelete) return;

    setGenerating(true);
    setError(null);

    try {
      setGeneratedLetter("");

      const { error: deleteError } = await supabase
        .from("applications")
        .update({ cover_letter: null })
        .eq("id", job.id);

      if (deleteError) throw deleteError;
      toast.info("Saatekirje poistettu.");
    } catch (err: any) {
      console.error("Poistovirhe:", err);
      setError("Saatekirjeen poistaminen tietokannasta epäonnistui.");
      toast.error("Poistaminen epäonnistui.");
    } finally {
      setGenerating(false);
    }
  }

  async function copyLetter() {
    if (!generatedLetter) return;
    await navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    toast.success("Teksti kopioitu leikepöydälle!");

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 size={36} className="animate-spin text-indigo-600" />
              <p className="text-sm font-medium">Ladataan tietoja...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Header />
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-xl mx-auto text-center">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={24} />
              </div>
              <h1 className="text-xl font-bold">Jokin meni pieleen</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                {error || "Tietoja ei saatu ladattua."}
              </p>
              <Link
                href="/job-assistant"
                className="inline-flex items-center gap-2 mt-6 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition"
              >
                <ArrowLeft size={16} />
                Palaa työnhakuavustajaan
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          article,
          article * {
            visibility: visible;
            color: black !important;
          }
          article {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
          article h1,
          article h2,
          article h3 {
            break-inside: avoid;
          }
        }
      `}</style>

      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header />

        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 print:p-0">
          
          <div className="flex items-center justify-between mb-6 print:hidden">
            <Link
              href={`/job-assistant/${job?.id}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
            >
              <ArrowLeft size={18} />
              Takaisin asiakirjojen tarkistukseen
            </Link>

            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
              <Sparkles size={16} className="text-indigo-500" />
              Duunify AI
            </div>
          </div>

          <StepIndicator currentStep={3} />

          <section className="mb-8 print:hidden">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 size={26} />
              </div>

              <div>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                  Saatekirje
                </p>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Hakemuksesi saatekirje
                </h1>
              </div>
            </div>
          </section>

          {job && <ResultHeader job={job} />}

          <div className="grid lg:grid-cols-[1fr_300px] gap-6 print:block">
            <CoverLetterCard
              generating={generating}
              generatedLetter={generatedLetter}
              error={error}
              isEditingHeader={isEditingHeader}
              editFullName={editFullName}
              editCity={editCity}
              editPhone={editPhone}
              editEmail={editEmail}
              onFullNameChange={setEditFullName}
              onCityChange={setEditCity}
              onPhoneChange={setEditPhone}
              onEmailChange={setEditEmail}
              onRegenerate={() => job && generateLetterWithGemini(job, true)}
            />

            <ResultSidebar
              generating={generating}
              hasLetter={!!generatedLetter}
              copied={copied}
              isEditingHeader={isEditingHeader}
              onCopy={copyLetter}
              onPrint={() => window.print()}
              onRegenerate={() => job && generateLetterWithGemini(job, true)}
              onToggleEditHeader={() => setIsEditingHeader(!isEditingHeader)}
              onDelete={deleteCoverLetter}
            />
          </div>

        </div>
      </main>
    </div>
  );
}