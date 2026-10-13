import Link from "next/link";
import { Copy, Download, RefreshCw, Pencil, Trash2, FileText } from "lucide-react";

interface ResultSidebarProps {
  generating: boolean;
  hasLetter: boolean;
  copied: boolean;
  isEditingHeader: boolean;
  onCopy: () => void;
  onPrint: () => void;
  onRegenerate: () => void;
  onToggleEditHeader: () => void;
  onDelete: () => void;
}

export function ResultSidebar({
  generating,
  hasLetter,
  copied,
  isEditingHeader,
  onCopy,
  onPrint,
  onRegenerate,
  onToggleEditHeader,
  onDelete,
}: ResultSidebarProps) {
  return (
    <aside className="space-y-3 pb-12 sm:pb-0 print:hidden">
      {/* LINKKI KAIKKIIN SAATEKIRJEISIIN */}
      <Link
        href="/job-assistant/cover-letters"
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition shadow-sm"
      >
        <FileText size={17} className="text-indigo-600 dark:text-indigo-400" />
        Kaikki saatekirjeet
      </Link>

      <button
        onClick={onCopy}
        disabled={generating || !hasLetter}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition disabled:opacity-50 shadow-sm"
      >
        <Copy size={17} />
        {copied ? "Kopioitu!" : "Kopioi saatekirje"}
      </button>

      <button
        onClick={onPrint}
        disabled={generating || !hasLetter}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-200 dark:border-[#1F2937] bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition disabled:opacity-50 shadow-sm"
      >
        <Download size={17} />
        Tulosta / Lataa PDF
      </button>

      <button
        onClick={onRegenerate}
        disabled={generating}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-200 dark:border-[#1F2937] bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition disabled:opacity-50 shadow-sm"
      >
        <RefreshCw size={17} className={generating ? "animate-spin" : ""} />
        {generating ? "Luodaan..." : "Luo uusi versio Geminillä"}
      </button>

      <button
        onClick={onToggleEditHeader}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-200 dark:border-[#1F2937] bg-white dark:bg-[#111827] hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold transition shadow-sm"
      >
        <Pencil size={17} />
        {isEditingHeader ? "Sulje muokkaus" : "Muokkaa ylätunnistetta"}
      </button>

      <button
        onClick={onDelete}
        disabled={generating || !hasLetter}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
      >
        <Trash2 size={17} />
        Poista saatekirje
      </button>
    </aside>
  );
}