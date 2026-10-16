"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import ApplicationSheet from "@/app/applications/ApplicationDialog";
import { Maximize2, SquarePen } from "lucide-react";
import { deleteApplicationWithLog } from "@/lib/applications";
import { CompanyLogo } from "@/components/applications/CompanyLogo";
import { DemoCompanyLogo } from "@/components/demo/DemoCompanyLogo";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Application = {
  id: string;
  company: string;
  job_title: string;
  location: string;
  status: string;
  notes: string;
  applied_date: string;
  job_description: string;
  job_url?: string;
  company_logo?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  employment_type?: string | null;
  valid_through?: string | null;
  created_at?: string | null;
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  Tallennettu: {
    label: "Tallennettu",
    className:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:ring-amber-500/40",
  },
  Haettu: {
    label: "Haettu",
    className:
      "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:ring-blue-500/30",
  },
  Haastattelu: {
    label: "Haastattelu",
    className:
      "bg-purple-50 text-purple-700 ring-1 ring-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:ring-purple-500/30",
  },
  Hylätty: {
    label: "Hylätty",
    className:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-300 dark:bg-red-500/15 dark:text-red-400 dark:ring-red-500/30",
  },
  Tarjous: {
    label: "🎉 Työtarjous saatu",
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-500/40",
  },
};

const EMPLOYMENT_TYPE_FI: Record<string, string> = {
  FULL_TIME: "Kokoaikainen",
  PART_TIME: "Osa-aikainen",
  CONTRACTOR: "Toimeksiantaja",
  TEMPORARY: "Määräaikainen",
  INTERN: "Harjoittelija",
  VOLUNTEER: "Vapaaehtoinen",
  PER_DIEM: "Päivätyö",
  OTHER: "Muu",
};

function formatDescription(text: string) {
  return text.split(/(\*\*.*?\*\*)/g).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong
          key={i}
          className="font-bold text-slate-900 dark:text-slate-100"
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function formatSalary(min?: number | null, max?: number | null): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => n.toLocaleString("fi-FI") + " €";
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `alkaen ${fmt(min)}`;
  if (max) return `enintään ${fmt(max)}`;
  return null;
}

function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("fi-FI", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

function MetaChip({
  icon,
  children,
  customStyle = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  customStyle?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[12px] font-medium ${customStyle}`}
    >
      {icon}
      {children}
    </span>
  );
}

// --- Icons ---
const IconPin = () => (
  <svg
    className="h-3 w-3 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 21c-4-4-7-7.5-7-11a7 7 0 1114 0c0 3.5-3 7-7 11z"
    />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
const IconCalendar = () => (
  <svg
    className="h-3 w-3 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const IconBriefcase = () => (
  <svg
    className="h-3 w-3 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"
    />
  </svg>
);
const IconCurrency = () => (
  <svg
    className="h-3 w-3 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.5 9a3 3 0 100 6H12m0-6h-1a2 2 0 000 4h1"
    />
  </svg>
);
const IconClock = () => (
  <svg
    className="h-3 w-3 shrink-0"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
  </svg>
);

export default function ApplicationCard({
  app,
  onChange,
  isDemo = false,
  onDelete,
}: {
  app: Application;
  onChange: () => void;
  isDemo?: boolean;
  onDelete?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingApplication, setEditingApplication] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [open, setOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    company: app.company,
    job_title: app.job_title,
    location: app.location,
    notes: app.notes || "",
    job_url: app.job_url || "",
  });

  const getSourceFromUrl = (urlStr: string) => {
    try {
      const hostname = new URL(urlStr).hostname.toLowerCase();
      return hostname.replace("www.", "");
    } catch {
      return "Linkki";
    }
  };

  async function deleteApplication() {
    if (isDemo) {
      if (onDelete) {
        onDelete();
      } else {
        toast.info("Hakemusten poistaminen ei ole käytössä demoversiossa.");
      }
      return;
    }

    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }

    setLoading(true);

    const { error } = await deleteApplicationWithLog({
      id: app.id,
      company: app.company,
      job_title: app.job_title,
      status: app.status,
    });

    setLoading(false);

    if (error) {
      toast.error("Poisto epäonnistui.");
      return;
    }

    toast.success("Hakemus poistettu.");
    onChange();
  }

  async function handleStatusChange(newStatus: string) {
    if (loading || newStatus === app.status) return;

    if (isDemo) {
      toast.info("Tilan vaihtaminen ei ole käytössä demoversiossa.");
      return;
    }

    setLoading(true);
    const oldStatus = app.status;

    try {
      const { error: appError } = await supabase
        .from("applications")
        .update({ status: newStatus })
        .eq("id", app.id);

      if (appError) throw appError;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("application_history").insert({
          user_id: user.id,
          application_id: app.id,
          event_type: "status_changed",
          old_status: oldStatus,
          new_status: newStatus,
        });
      }

      toast.success(`Hakemuksen tila päivitetty: ${newStatus}`);
      onChange();
    } catch (error) {
      console.error("Virhe tilan päivityksessä:", error);
      toast.error("Tilan päivitys epäonnistui.");
    } finally {
      setLoading(false);
    }
  }

  async function saveApplication(e?: React.FormEvent) {
    if (e) e.preventDefault();

    if (isDemo) {
      toast.info("Hakemusten muokkaaminen ei ole käytössä demoversiossa.");
      setEditingApplication(false);
      return;
    }

    if (loading) return;
    setLoading(true);

    const { error } = await supabase
      .from("applications")
      .update({
        company: editForm.company,
        job_title: editForm.job_title,
        location: editForm.location,
        notes: editForm.notes,
        job_url: editForm.job_url,
      })
      .eq("id", app.id);

    if (error) {
      console.error("Virhe muokkauksessa:", error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setEditingApplication(false);
    onChange();
  }

  const description = app.job_description || "";
  const isOffer = app.status === "Tarjous";
  const salary = formatSalary(app.salary_min, app.salary_max);
  const employmentLabel = app.employment_type
    ? (EMPLOYMENT_TYPE_FI[app.employment_type] ?? app.employment_type)
    : null;

  const deadlineDate = app.valid_through ? new Date(app.valid_through) : null;
  const deadline = formatDate(app.valid_through);

  const isExpired =
    deadlineDate !== null && deadlineDate.getTime() < Date.now();

  const isUrgent =
    deadlineDate !== null &&
    !isExpired &&
    (deadlineDate.getTime() - Date.now()) / 86_400_000 <= 3;

  const isSavedOnly = app.status === "Tallennettu";
  const appliedDate = formatDate(app.applied_date);
  const createdDate = formatDate(app.created_at);

  return (
    <div
      onClick={() => setOpen(true)}
      className={`cursor-pointer relative flex flex-col h-full rounded-2xl border pb-[52px] bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isOffer
          ? "border-emerald-300 ring-1 ring-emerald-200 dark:border-emerald-500/50 dark:ring-emerald-500/20"
          : "border-slate-200 dark:border-slate-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {isDemo ? (
            <DemoCompanyLogo logo={app.company_logo} company={app.company} />
          ) : (
            <CompanyLogo logo={app.company_logo} company={app.company} />
          )}
          <div className="min-w-0">
            <h2 className="text-[17px] font-semibold leading-snug text-slate-900 dark:text-slate-50 truncate">
              {app.company}
            </h2>
            <p className="text-[14px] text-slate-500 dark:text-slate-400 truncate">
              {app.job_title}
            </p>

            <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
              <IconPin />
              <span>{app.location || "Sijainti ei tiedossa"}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setEditingApplication(true);
            setOpen(false);
          }}
          title="Muokkaa ilmoitusta"
          className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 transition-colors shrink-0"
        >
          <SquarePen size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Meta chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {isSavedOnly ? (
          <MetaChip
            icon={<IconCalendar />}
            customStyle="bg-amber-50/70 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 font-medium"
          >
            Tallennettu {createdDate || appliedDate}
          </MetaChip>
        ) : appliedDate ? (
          <MetaChip
            icon={<IconCalendar />}
            customStyle="bg-emerald-50/70 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30 font-medium"
          >
            Haettu {appliedDate}
          </MetaChip>
        ) : null}

        {deadline && (
          <MetaChip
            icon={<IconClock />}
            customStyle="bg-amber-50/70 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30 font-medium"
          >
            {isExpired ? (
              <span className="font-semibold text-red-600 dark:text-red-400">
                Haku päättynyt {deadline}
              </span>
            ) : (
              <span
                className={
                  isUrgent
                    ? "font-semibold text-orange-600 dark:text-orange-400"
                    : ""
                }
              >
                Päättyy {deadline}
                {isUrgent && " ⚠️"}
              </span>
            )}
          </MetaChip>
        )}

        {employmentLabel && (
          <MetaChip icon={<IconBriefcase />}>{employmentLabel}</MetaChip>
        )}
        {salary && <MetaChip icon={<IconCurrency />}>{salary}</MetaChip>}
      </div>

      {/* Divider */}
      <div className="my-4 border-t border-slate-100 dark:border-slate-800" />

      {/* Status row */}
      <div
        onClick={(e) => {
          e.stopPropagation();
        }}
        className="flex items-center gap-2.5"
      >
        <Select
          value={app.status}
          onValueChange={handleStatusChange}
          disabled={loading}
        >
          <SelectTrigger
            className={`w-fit !h-6 min-h-0 rounded-full px-3 py-0 border-0 focus:ring-0 focus:ring-offset-0 text-[11px] font-semibold uppercase tracking-wide shadow-none [&>svg]:ml-1.5 [&>svg]:h-3.5 [&>svg]:w-3.5 transition-all hover:brightness-95 dark:hover:brightness-110 ${
              STATUS_CONFIG[app.status]?.className || ""
            }`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="min-w-[180px] p-1.5 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2">
            <SelectItem
              value="Tallennettu"
              className="cursor-pointer py-2.5 text-[13px]"
            >
              Tallennettu
            </SelectItem>
            <SelectItem
              value="Haettu"
              className="cursor-pointer py-2.5 text-[13px]"
            >
              Haettu
            </SelectItem>
            <SelectItem
              value="Haastattelu"
              className="cursor-pointer py-2.5 text-[13px]"
            >
              Haastattelu
            </SelectItem>
            <SelectItem
              value="Hylätty"
              className="cursor-pointer py-2.5 text-[13px]"
            >
              Hylätty
            </SelectItem>
            <SelectItem
              value="Tarjous"
              className="cursor-pointer py-2.5 text-[13px]"
            >
              🎉 Työtarjous saatu
            </SelectItem>
          </SelectContent>
        </Select>

        {app.job_url && (
          <a
            href={app.job_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium text-violet-600 dark:text-violet-400 hover:underline shrink-0"
          >
            Avaa linkki
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>

      {/* EDIT FORM */}
      {editingApplication && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-4 space-y-3 rounded-2xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 p-4"
        >
          <input
            value={editForm.company}
            onChange={(e) =>
              setEditForm({ ...editForm, company: e.target.value })
            }
            onClick={(e) => e.stopPropagation()}
            placeholder="Yritys"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
          />

          <input
            value={editForm.job_title}
            onChange={(e) =>
              setEditForm({ ...editForm, job_title: e.target.value })
            }
            placeholder="Työtehtävä"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
          />

          <input
            value={editForm.location}
            onChange={(e) =>
              setEditForm({ ...editForm, location: e.target.value })
            }
            placeholder="Paikkakunta"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
          />

          <input
            value={editForm.job_url}
            onChange={(e) =>
              setEditForm({ ...editForm, job_url: e.target.value })
            }
            placeholder="Työpaikkailmoituksen URL"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
          />

          <textarea
            value={editForm.notes || ""}
            onChange={(e) =>
              setEditForm({ ...editForm, notes: e.target.value })
            }
            placeholder="Muistiinpanot"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
            rows={4}
          />

          <div className="flex gap-2">
            <button
              onClick={saveApplication}
              disabled={loading}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
            >
              💾 Tallenna
            </button>

            <button
              onClick={() => setEditingApplication(false)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
            >
              Peruuta
            </button>
            <button
              onClick={deleteApplication}
              disabled={loading}
              aria-label="Poista hakemus"
              className={`rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 font-medium text-white cursor-pointer ${
                confirmDelete
                  ? "animate-pulse bg-red-500 text-black dark:text-white"
                  : "bg-red-400 hover:text-white hover:bg-red-500 dark:bg-red-500/20 dark:text-red-400 dark:hover:bg-red-500/40"
              }`}
            >
              {loading
                ? "Poistetaan.."
                : confirmDelete
                  ? "Vahvista?"
                  : "Poista"}
            </button>
          </div>
        </div>
      )}

      {/* Notes */}
      {app.notes && (
        <div
          onClick={() => setOpen(true)}
          className="cursor-pointer mt-4 rounded-xl border-l-2 border-violet-300 dark:border-violet-500 bg-slate-50 dark:bg-slate-800/40 py-2.5 pl-3.5 pr-3"
        >
          <p className="mb-0.5 text-[13px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Muistiinpanot
          </p>
          <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2 overflow-hidden">
            {app.notes}
          </p>
        </div>
      )}

      {/* Description */}
      {description && (
        <div
          onClick={() => setOpen(true)}
          className="mt-4 cursor-pointer flex-1"
        >
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Työpaikkakuvaus
          </p>
          
       {/* Työpaikkakuvaus adaptiivisella taustalla (Light / Dark) */}
          <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#0d0f1a] border border-slate-200 dark:border-slate-800 shadow-inner text-slate-800 dark:text-slate-300">
            <div
              className={`text-[13px] leading-relaxed whitespace-pre-wrap overflow-hidden ${app.notes ? "line-clamp-3" : "line-clamp-5"}`}
            >
              {expanded
                ? formatDescription(description)
                : formatDescription(`${description.slice(0, 600)}…`)}
            </div>

            {description.length > 600 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(true);
                }}
                className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {expanded ? "Näytä vähemmän" : "Lue lisää"}
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>

          <div className="absolute bottom-5 left-5">
            <p className="text-[12px] text-slate-400 dark:text-slate-500 pointer-none">
              {app.job_url ? getSourceFromUrl(app.job_url) : "Ei saatavilla"}
            </p>
          </div>

          <div className="absolute bottom-5 right-5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpen(true);
              }}
              className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer"
              title="Avaa ilmoitus"
            >
              <Maximize2 size={18} strokeWidth={2} />
            </button>
          </div>
          <ApplicationSheet
            open={open}
            onOpenChange={setOpen}
            app={app}
            isDemo={isDemo}
          />
        </div>
      )}
    </div>
  );
}