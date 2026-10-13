"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { FileText, Sparkles, Calendar, Search, Trash2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

interface CoverLetter {
  id: string;
  job_title: string;
  company_name: string;
  content: string;
  created_at: string;
}

export default function CoverLettersPage() {
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<CoverLetter | null>(null);
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
      .from("cover_letters")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setLetters(data);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("cover_letters")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Saatekirjeen poisto epäonnistui.");
      return;
    }

    setLetters((prev) => prev.filter((l) => l.id !== id));
    if (selectedLetter?.id === id) setSelectedLetter(null);
    toast.success("Saatekirje poistettu.");
  }

  function handleCopy(content: string, id: string) {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Saatekirje kopioitu leikepöydälle!");
    setTimeout(() => setCopiedId(null), 2000);
  }

  const filteredLetters = letters.filter(
    (l) =>
      l.job_title.toLowerCase().includes(query.toLowerCase()) ||
      l.company_name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0B0F19]">
      {/* Sivupalkki */}
      <Sidebar />

      {/* Pääsisällön alue */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 p-6 max-w-6xl w-full mx-auto space-y-6">
          {/* Sivun otsikko ja haku */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  <Sparkles size={22} />
                </div>
                Generoidut saatekirjeet
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Selaa, kopioi ja hallinnoi tekoälyllä luomiasi saatekirjeitä.
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Etsi yrityksen tai tehtävän mukaan..."
                className="w-full h-10 pl-9 pr-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Listaus / Sisältö */}
          {loading ? (
            <div className="text-center py-16 text-slate-400">Ladataan saatekirjeitä...</div>
          ) : filteredLetters.length === 0 ? (
            <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3 shadow-sm">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                <FileText size={24} />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">Ei saatekirjeitä vielä</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Kun luot uuden hakemuksen yhteydessä tekoälyllä saatekirjeen, se tallentuu automaattisesti tänne.
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
                        {item.job_title}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                        {item.company_name}
                      </p>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed bg-slate-50 dark:bg-[#0B0F19] p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                      {item.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/60">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(item.content, item.id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 transition"
                    >
                      {copiedId === item.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      <span>{copiedId === item.id ? "Kopioitu!" : "Kopioi"}</span>
                    </button>

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
        </main>
      </div>

      {/* LUKUMODALI YKSITTÄISELLE SAATEKIRJEELLE */}
      {selectedLetter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          style={{ background: "rgba(3, 7, 18, 0.6)" }}
          onClick={() => setSelectedLetter(null)}
        >
          <div
            className="bg-white dark:bg-[#111827] rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">
                  {selectedLetter.job_title}
                </h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                  {selectedLetter.company_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedLetter(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0B0F19] p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {selectedLetter.content}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => handleCopy(selectedLetter.content, selectedLetter.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition"
              >
                {copiedId === selectedLetter.id ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedId === selectedLetter.id ? "Kopioitu leikepöydälle!" : "Kopioi koko saatekirje"}</span>
              </button>

              <button
                onClick={() => setSelectedLetter(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition"
              >
                Sulje
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}