"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { ArrowLeft, Loader2, AlertCircle, Coins } from "lucide-react";

import { StepIndicator } from "@/components/job-assistant/StepIndicator";
import { JobHeader, Application } from "@/components/job-assistant/id/JobHeader";
import { JobDescriptionCard } from "@/components/job-assistant/id/JobDescriptionCard";
import { UserDocumentsCard } from "@/components/job-assistant/id/UserDocumentsCard";
import { InfoSidebar } from "@/components/job-assistant/id/InfoSidebar";
import { UserDocument } from "@/components/job-assistant/id/DocumentItem";

function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");
}

export default function JobAssistantJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const jobId = resolvedParams.id;

  const [job, setJob] = useState<Application | null>(null);
  const [cvDoc, setCvDoc] = useState<UserDocument | null>(null);
  const [coverLetterDoc, setCoverLetterDoc] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedLogo, setFailedLogo] = useState(false);

  const [uploadingCv, setUploadingCv] = useState(false);
  const [uploadingLetter, setUploadingLetter] = useState(false);
  const [deletingType, setDeletingType] = useState<"cv" | "letter" | null>(null);
  const [openingType, setOpeningType] = useState<"cv" | "letter" | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

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

        setJob(jobData);

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("cv_filename, cv_updated_at, letter_filename, letter_updated_at")
            .eq("id", user.id)
            .maybeSingle();

          if (profile?.cv_filename) {
            setCvDoc({
              name: profile.cv_filename,
              updated: profile.cv_updated_at
                ? `Päivitetty ${new Date(profile.cv_updated_at).toLocaleDateString("fi-FI")}`
                : "Aktiivinen",
            });
          }

          if (profile?.letter_filename) {
            setCoverLetterDoc({
              name: profile.letter_filename,
              updated: profile.letter_updated_at
                ? `Päivitetty ${new Date(profile.letter_updated_at).toLocaleDateString("fi-FI")}`
                : "Aktiivinen",
            });
          }
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Alustusvirhe:", err);
        setError("Tietojen lataaminen epäonnistui.");
        setLoading(false);
      }
    }

    if (jobId) {
      loadData();
    }
  }, [jobId]);

  const handleFileOpen = async (type: "cv" | "letter") => {
    const docToOpen = type === "cv" ? cvDoc : coverLetterDoc;
    if (!docToOpen) return;

    setOpeningType(type);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Käyttäjä ei ole kirjautunut sisään.");

      const storagePath = `${user.id}/${type}_${docToOpen.name}`;

      const { data, error: signedUrlError } = await supabase.storage
        .from("documents")
        .createSignedUrl(storagePath, 60);

      if (signedUrlError || !data?.signedUrl) {
        throw new Error("Tiedoston avaaminen epäonnistui.");
      }

      window.open(data.signedUrl, "_blank");
    } catch (err: any) {
      console.error(`Virhe tiedoston (${type}) avaamisessa:`, err);
      alert("Tiedoston avaaminen epäonnistui. Varmista, että tiedosto on ladattu oikein.");
    } finally {
      setOpeningType(null);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cv" | "letter"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 500 * 1024;

    if (file.size > MAX_FILE_SIZE) {
      alert(`Tiedosto on liian suuri (${(file.size / 1024).toFixed(0)} KB). Tiedoston maksimikoko on 500 KB.`);
      e.target.value = "";
      return;
    }

    if (type === "cv") setUploadingCv(true);
    else setUploadingLetter(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Käyttäjä ei ole kirjautunut sisään.");

      const safeName = sanitizeFileName(file.name);
      const storagePath = `${user.id}/${type}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, file, { upsert: true });

      if (uploadError) {
        console.warn("Storage-lataus epäonnistui:", uploadError);
      }

      const now = new Date().toISOString();

      const updates =
        type === "cv"
          ? { cv_filename: safeName, cv_updated_at: now }
          : { letter_filename: safeName, letter_updated_at: now };

      const { error: profileError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (profileError) throw profileError;

      const updatedDoc = {
        name: safeName,
        updated: `Päivitetty ${new Date().toLocaleDateString("fi-FI")}`,
      };

      if (type === "cv") setCvDoc(updatedDoc);
      else setCoverLetterDoc(updatedDoc);
    } catch (err: any) {
      console.error(`Virhe tiedoston (${type}) latauksessa:`, err);
      alert("Tiedoston lataus epäonnistui. Yritä uudelleen.");
    } finally {
      if (type === "cv") setUploadingCv(false);
      else setUploadingLetter(false);
      e.target.value = "";
    }
  };

  const handleFileDelete = async (type: "cv" | "letter") => {
    const docToDelete = type === "cv" ? cvDoc : coverLetterDoc;
    if (!docToDelete) return;

    if (!confirm(`Haluatko varmasti poistaa tiedoston "${docToDelete.name}"?`)) {
      return;
    }

    setDeletingType(type);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Käyttäjä ei ole kirjautunut sisään.");

      const storagePath = `${user.id}/${type}_${docToDelete.name}`;
      await supabase.storage.from("documents").remove([storagePath]);

      const updates =
        type === "cv"
          ? { cv_filename: null, cv_updated_at: null }
          : { letter_filename: null, letter_updated_at: null };

      const { error: profileError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (profileError) throw profileError;

      if (type === "cv") setCvDoc(null);
      else setCoverLetterDoc(null);
    } catch (err: any) {
      console.error(`Virhe tiedoston (${type}) poistossa:`, err);
      alert("Poisto epäonnistui. Yritä uudelleen.");
    } finally {
      setDeletingType(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 size={36} className="animate-spin text-indigo-600" />
              <p className="text-sm font-medium">Ladataan työpaikan tietoja...</p>
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
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header />

        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          
          <Link
            href="/job-assistant"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition mb-6"
          >
            <ArrowLeft size={17} />
            Takaisin työpaikkoihin
          </Link>

          {/* SIVUN ASKELEET */}
          <StepIndicator currentStep={2} />

          {/* TYÖPAIKAN HEADER */}
          {job && (
            <JobHeader
              job={job}
              failedLogo={failedLogo}
              onLogoError={() => setFailedLogo(true)}
            />
          )}

          {/* KREDIITTi-INFO BORDER / BANNERI ENNEN GENEROINTIA */}
          <div className="my-6 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-3">
            <Coins className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div className="text-xs sm:text-sm text-indigo-900 dark:text-indigo-200">
              <span className="font-semibold"></span> Saatekirjeen generointi ja räätälöinti työpaikalle kuluttaa <span className="font-bold">1 AI-krediitin</span>.
            </div>
          </div>

          {/* PÄÄSISÄLTÖ GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.8fr] gap-6">
            <JobDescriptionCard
              notes={job?.notes}
              description={job?.job_description}
            />

            <div className="space-y-6">
              <UserDocumentsCard
                cvDoc={cvDoc}
                coverLetterDoc={coverLetterDoc}
                uploadingCv={uploadingCv}
                uploadingLetter={uploadingLetter}
                deletingType={deletingType}
                openingType={openingType}
                onOpen={handleFileOpen}
                onUpload={handleFileUpload}
                onDelete={handleFileDelete}
              />

              <InfoSidebar />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}