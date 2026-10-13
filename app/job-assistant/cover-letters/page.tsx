"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FileText, Sparkles, Calendar, Search, Trash2, Copy, Check, ExternalLink, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ApplicationLetter {
  id: string;
  job_title: string;
  company: string;
  cover_letter: string;
  created_at: string;
}

export default function CoverLettersPage() {
  const [letters, setLetters] = useState<ApplicationLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<ApplicationLetter | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCoverLetters();
  }, []);

  async function fetchCoverLetters() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("applications")
      .select("id, job_title, company, cover_letter, created_at")
      .eq("user_id", session.user.id)
      .not("cover_letter", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Saatekirjeiden lataus epäonnistui.");
    } else if (data) {
      setLetters(data.filter((item) => item.cover_letter && item.cover_letter.trim() !== ""));
    }
    
    setLoading(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("applications")
      .update({ 
        cover_letter: null,
        created_at: new Date().toISOString() 
      })
      .eq("id", id);

    if (error) {
      toast.error("Saatekirjeen poisto epäonnistui.");
      return;
    }

    setLetters((prev) => prev.filter((l) => l.id !== id));
    if (selectedLetter?.id === id) setSelectedLetter(null);
    toast.success("Saatekirje poistettu hakemukselta.");
  }

  function handleCopy(content: string, id: string) {
    const cleanText = content.replace(/\*\*/g, "").replace(/## /g, "").replace(/# /g, "");
    navigator.clipboard.writeText(cleanText);
    setCopiedId(id);
    toast.success("Kopioitu leikepöydälle!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredLetters = letters.filter(
    (l) =>
      (l.job_title || "").toLowerCase().includes(query.toLowerCase()) ||
      (l.company || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* YLÄPALKKI (HEADER) */}
        <Header />

        <div className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-6 pb-16">
          {/* TAKAISIN-PAINIKE JA OTSIKKOALUE */}
          <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <Link
              href="/job-assistant"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              <ArrowLeft size={15} />
              <span>Takaisin työassistenttiin</span>
            </Link>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                    <Sparkles size={22} />
                  </div>
                  Generoidut saatekirjeet
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Selaa, kopioi ja hallinnoi työhakemusten yhteyteen tallennettuja saatekirjeitä.
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Etsi yrityksen tai tehtävän mukaan..."
                  className="w-full h-10 pl-9 pr-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16 text-slate-400">Ladataan saatekirjeitä...</div>
          ) : filteredLetters.length === 0 ? (
            <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 shadow-sm">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                <FileText size={24} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">Ei saatekirjeitä vielä</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Kun luot työhakemukselle saatekirjeen tekoälyllä, se näkyy automaattisesti täällä.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLetters.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedLetter(item)}
                  className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:border-indigo-500/50 transition cursor-pointer flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {new Date(item.created_at).toLocaleDateString("fi-FI")}
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full">
                        AI Saatekirje
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 transition truncate">
                        {item.job_title || "Nimetön tehtävä"}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                        {item.company || "Tuntematon yritys"}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed bg-slate-50 dark:bg-[#0B0F19] p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                      {item.cover_letter
                        ?.replace(/\*\*/g, "")
                        ?.replace(/##/g, "")
                        ?.replace(/# /g, "")
                        ?.trim()}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(item.cover_letter, item.id);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition"
                      >
                        {copiedId === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        <span>{copiedId === item.id ? "Kopioitu!" : "Kopioi"}</span>
                      </button>

                      <Link
                        href={`/job-assistant/${item.id}/result`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition"
                        title="Siirry tulossivulle"
                      >
                        <span>Avaa</span>
                        <ExternalLink size={13} />
                      </Link>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      title="Poista saatekirje"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ANIMOITU MODALI FRAMER-MOTIONILLA */}
      <AnimatePresence>
        {selectedLetter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-950/60"
            onClick={() => setSelectedLetter(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white dark:bg-[#111827] rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                    {selectedLetter.job_title}
                  </h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    {selectedLetter.company}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLetter(null)}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0B0F19] p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60 text-sm text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
                <ReactMarkdown
                  components={{
                    h2: ({ node, ...props }) => (
                      <h2 className="text-base font-extrabold text-slate-900 dark:text-white mt-4 mb-2 border-b border-slate-200 dark:border-slate-800 pb-1" {...props} />
                    ),
                    p: ({ node, ...props }) => (
                      <p className="mb-3 leading-relaxed text-slate-700 dark:text-slate-300" {...props} />
                    ),
                    strong: ({ node, ...props }) => (
                      <strong className="font-bold text-slate-900 dark:text-white" {...props} />
                    ),
                  }}
                >
                  {selectedLetter.cover_letter}
                </ReactMarkdown>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(selectedLetter.cover_letter, selectedLetter.id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                  >
                    {copiedId === selectedLetter.id ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copiedId === selectedLetter.id ? "Kopioitu!" : "Kopioi teksti"}</span>
                  </button>

                  <Link
                    href={`/job-assistant/${selectedLetter.id}/result`}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
                  >
                    <span>Siirry hakemukseen</span>
                    <ExternalLink size={14} />
                  </Link>
                </div>

                <button
                  onClick={() => setSelectedLetter(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                >
                  Sulje
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}