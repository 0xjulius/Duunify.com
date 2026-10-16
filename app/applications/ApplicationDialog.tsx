"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDemoHistoryForApp } from "@/lib/demo-data";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CompanyLogo } from "@/components/applications/CompanyLogo";
import ApplicationHistory, {
  HistoryItem,
} from "@/components/applications/ApplicationHistory";
import {
  Calendar,
  MapPin,
  Link as LinkIcon,
  FileText,
  X,
  Clock,
  Paperclip,
  Download,
  Trash2,
  Upload,
  Coins,
  Briefcase,
  ChevronDown,
} from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: any;
  isDemo?: boolean;
  onUpdate?: () => void;
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

const STATUS_OPTIONS = [
  "Tallennettu",
  "Haettu",
  "Haastattelu",
  "Hylätty",
  "Tarjous",
];

function getStatusStyles(status: string) {
  switch (status) {
    case "Tallennettu":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40";
    case "Haettu":
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30";
    case "Haastattelu":
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30";
    case "Hylätty":
      return "bg-slate-100 text-slate-700 border-slate-300 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30";
    case "Tarjous":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40";
    default:
      return "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20";
  }
}

const formatDateTime = (dateVal?: string | Date) => {
  if (!dateVal) return "";
  try {
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return "";

    const pvm = date.toLocaleDateString("fi-FI", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });

    const klo = date.toLocaleTimeString("fi-FI", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${pvm} klo ${klo}`;
  } catch (e) {
    return "";
  }
};

function formatDialogSalary(
  min?: number | null,
  max?: number | null,
): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => n.toLocaleString("fi-FI") + " €";
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `alkaen ${fmt(min)}`;
  if (max) return `enintään ${fmt(max)}`;
  return null;
}

function DialogMetaChip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
      {icon}
      {children}
    </span>
  );
}

export default function ApplicationDialog({
  open,
  onOpenChange,
  app,
  onUpdate,
  isDemo = false,
}: Props) {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [currentCvUrl, setCurrentCvUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [currentStatus, setCurrentStatus] = useState<string>("Haettu");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Haitaritilat: liitteet ja muistiinpanot
  const [isAttachmentsOpen, setIsAttachmentsOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Swipe to close
  const touchStartX = useRef<number>(0);
  const touchCurrentX = useRef<number>(0);
  const [translateX, setTranslateX] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchCurrentX.current = e.targetTouches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    const currentX = e.targetTouches[0].clientX;
    touchCurrentX.current = currentX;

    const diffX = currentX - touchStartX.current;
    if (diffX > 0) {
      setTranslateX(diffX);
    }
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    const swipeDistance = touchCurrentX.current - touchStartX.current;
    if (swipeDistance > 80) {
      onOpenChange(false);
    }
    setTranslateX(0);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        statusMenuRef.current &&
        !statusMenuRef.current.contains(event.target as Node)
      ) {
        setStatusMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) {
      setTranslateX(0);
      setStatusMenuOpen(false);
      setIsEditingNotes(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && app) {
      const cvVal = app.cv_url || null;
      setCurrentCvUrl(cvVal);
      setCurrentStatus(app.status || "Haettu");
      const notesVal = app.notes || "";
      setEditedNotes(notesVal);
      setIsEditingNotes(false);

      // Avataan haitarit automaattisesti, jos niissä on dataa
      setIsAttachmentsOpen(Boolean(cvVal) || isDemo);
      setIsNotesOpen(Boolean(notesVal.trim()));
    }
  }, [open, app, isDemo]);

  const fetchHistory = useCallback(async () => {
    if (!app?.id || isDemo) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("application_history")
        .select(
          "id, event_type, old_status, new_status, description, created_at",
        )
        .eq("application_id", app.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedData: HistoryItem[] = (data || []).map((item) => ({
        ...item,
        description: item.description || "",
      }));

      setHistory(mappedData);
    } catch (err) {
      console.error("Virhe historian latauksessa:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, [app?.id, isDemo]);

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open, fetchHistory]);

  async function handleStatusChange(newStatus: string) {
    if (newStatus === currentStatus || updatingStatus) return;

    if (isDemo) {
      toast.info("Tilan vaihtaminen ei ole käytössä demotilassa.");
      return;
    }

    setUpdatingStatus(true);
    const oldStatus = currentStatus;

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

      setCurrentStatus(newStatus);
      toast.success(`Hakemuksen tila päivitetty: ${newStatus}`);

      await fetchHistory();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error("Virhe tilan päivityksessä:", error);
      toast.error("Tilan päivitys epäonnistui.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleSaveNotes() {
    if (isDemo) {
      toast.info("Muistiinpanojen muokkaus ei ole käytössä demotilassa.");
      setIsEditingNotes(false);
      return;
    }

    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from("applications")
        .update({ notes: editedNotes })
        .eq("id", app.id);

      if (error) throw error;

      app.notes = editedNotes;

      toast.success("Muistiinpanot tallennettu!");
      setIsEditingNotes(false);
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error(error);
      toast.error("Muistiinpanojen tallennus epäonnistui.");
    } finally {
      setSavingNotes(false);
    }
  }

  useEffect(() => {
    async function getSignedUrl() {
      if (!currentCvUrl) {
        setDownloadUrl(null);
        return;
      }

      try {
        const { data, error } = await supabase.storage
          .from("attachments")
          .createSignedUrl(currentCvUrl, 3600);

        if (error) {
          console.error("Virhe suojatun linkin luonnissa:", error);
          setDownloadUrl(null);
        } else if (data) {
          setDownloadUrl(data.signedUrl);
        }
      } catch (err) {
        console.error(err);
        setDownloadUrl(null);
      }
    }

    if (open) {
      if (currentCvUrl) {
        getSignedUrl();
      } else {
        setDownloadUrl(null);
      }
    }
  }, [currentCvUrl, open]);

  if (!app) return null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || uploading) return;

    setUploading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Et ole kirjautunut sisään.");

      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from("attachments")
        .upload(fileName, selectedFile);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("applications")
        .update({ cv_url: storageData.path })
        .eq("id", app.id);

      if (dbError) throw dbError;

      toast.success("Liitetiedosto lisätty onnistuneesti!");
      setCurrentCvUrl(storageData.path);
      setIsAttachmentsOpen(true);

      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error(error);
      toast.error(
        "Lataus epäonnistui: " + (error.message || "Tuntematon virhe"),
      );
    } finally {
      setUploading(false);
    }
  }

  async function deleteAttachment() {
    if (!currentCvUrl || deleting) return;

    if (!confirm("Haluatko varmasti poistaa tämän liitetiedoston?")) return;

    setDeleting(true);
    try {
      const { error: storageError } = await supabase.storage
        .from("attachments")
        .remove([currentCvUrl]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("applications")
        .update({ cv_url: null })
        .eq("id", app.id);

      if (dbError) throw dbError;

      toast.success("Liitetiedosto poistettu");
      setCurrentCvUrl(null);
      setDownloadUrl(null);

      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error(error);
      toast.error(
        "Poisto epäonnistui: " + (error.message || "Tuntematon virhe"),
      );
    } finally {
      setDeleting(false);
    }
  }

  const salary = formatDialogSalary(app.salary_min, app.salary_max);
  const employmentLabel = app.employment_type
    ? (EMPLOYMENT_TYPE_FI[app.employment_type] ?? app.employment_type)
    : null;

  const appliedEvent = history.find((h) => h.new_status === "Haettu");
  const actualAppliedDate = appliedEvent
    ? appliedEvent.created_at
    : app.applied_date || app.created_at;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          left: translateX > 0 ? `calc(50% + ${translateX}px)` : "50%",
          transition: isSwiping
            ? "none"
            : "left 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="!max-w-4xl !w-[96vw] md:!w-[90vw] h-[90vh] max-h-[90vh] p-0 overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl select-none"
      >
        {/* KIINTEÄ YLÄPISSELI (HEADER & SULKUNAPPI) */}
        <div className="relative px-5 pt-5 pb-4 md:px-8 md:pt-8 md:pb-6 border-b border-slate-100 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-20 shrink-0">
          <div className="absolute top-4 right-4 md:top-6 md:right-6">
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <X size={20} />
              </Button>
            </DialogClose>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-11 w-11 shrink-0 flex items-center justify-center">
                <CompanyLogo
                  logo={app.company_logo || app.logo}
                  company={app.company || "Yritys"}
                />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50 truncate">
                  {app.company}
                </DialogTitle>
                <h2 className="text-sm md:text-base font-medium text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {app.job_title}
                </h2>
              </div>
            </div>

            {/* STATUS & LINKKI */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative inline-block text-left" ref={statusMenuRef}>
                <button
                  onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                  disabled={updatingStatus}
                  className={`flex items-center gap-1.5 cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-wide border outline-none transition-all hover:brightness-95 dark:hover:brightness-110 ${getStatusStyles(currentStatus)}`}
                >
                  {currentStatus === "Tarjous" ? "🎉 Työtarjous" : currentStatus}
                  <svg
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${statusMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {statusMenuOpen && (
                  <div className="absolute z-50 top-full left-0 mt-1.5 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden py-1.5">
                    {STATUS_OPTIONS.map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          handleStatusChange(st);
                          setStatusMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                          currentStatus === st
                            ? "bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 font-semibold"
                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 font-medium"
                        }`}
                      >
                        {st === "Tarjous" ? "🎉 Työtarjous saatu" : st}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {app.job_url && (
                <a
                  href={app.job_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-medium hover:underline text-xs md:text-sm"
                >
                  <LinkIcon size={14} /> Avaa ilmoitus
                </a>
              )}
            </div>
          </div>

          {/* METADATA CHIPS */}
          <div className="flex flex-wrap gap-2 pt-3">
            {app.location && (
              <DialogMetaChip icon={<MapPin size={13} className="text-slate-400" />}>
                {app.location}
              </DialogMetaChip>
            )}

            {employmentLabel && (
              <DialogMetaChip icon={<Briefcase size={13} className="text-slate-400" />}>
                {employmentLabel}
              </DialogMetaChip>
            )}

            {salary && (
              <DialogMetaChip icon={<Coins size={13} className="text-slate-400" />}>
                {salary}
              </DialogMetaChip>
            )}

            {actualAppliedDate && (
              <DialogMetaChip icon={<Calendar size={13} className="text-slate-400" />}>
                Haettu {formatDateTime(actualAppliedDate)}
              </DialogMetaChip>
            )}

            {app.valid_through && (
              <DialogMetaChip icon={<Clock size={13} className="text-slate-400" />}>
                Päättyy {formatDateTime(app.valid_through)}
              </DialogMetaChip>
            )}
          </div>
        </div>

        {/* VIERITETTÄVÄ ALUE */}
        <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 text-left">
          {/* LIITETIEDOSTOT & MUISTIINPANOT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* LIITETIEDOSTOT (COLLAPSIBLE / HAITARI) */}
            <div className="space-y-3 flex flex-col">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsAttachmentsOpen(!isAttachmentsOpen)}
                  className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-slate-50 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  <Paperclip size={16} className="text-slate-400" />
                  <span>Liitetiedostot</span>
                  {(currentCvUrl || isDemo) && !isAttachmentsOpen && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500" title="Sisältää liitteen" />
                  )}
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${
                      isAttachmentsOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {isAttachmentsOpen && (
                <div className="animate-in fade-in duration-200">
                  {currentCvUrl ? (
                    downloadUrl ? (
                      <div className="flex items-center justify-between p-3 rounded-2xl border bg-slate-50/50 border-slate-200/80 dark:bg-slate-800/40 dark:border-slate-700/60 w-full">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 truncate mr-4">
                          <FileText size={16} className="text-slate-400 shrink-0" />
                          <span className="truncate">{currentCvUrl.split("/").pop()}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs"
                          >
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
                              <Download size={12} /> Avaa
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 h-8 w-8 p-0"
                            onClick={deleteAttachment}
                            disabled={deleting || isDemo}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 animate-pulse">Luodaan suojattua linkkiä...</p>
                    )
                  ) : isDemo ? (
                    <div className="w-full p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 text-center">
                      <p className="text-sm text-indigo-500 dark:text-indigo-400 font-medium">
                        tyohakemus_yritys.pdf <span className="text-xs text-slate-400 ml-1">(225KB)</span>
                      </p>
                    </div>
                  ) : (
                    <div className="w-full">
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl cursor-pointer bg-slate-50/50 dark:bg-slate-800/20 transition-all">
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <Upload size={18} className="text-slate-400 mb-1" />
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {uploading ? "Ladataan..." : "Klikkaa lisätäksesi liite"}
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          disabled={uploading}
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MUISTIINPANOT (COLLAPSIBLE / HAITARI) */}
            <div className="space-y-3 flex flex-col">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsNotesOpen(!isNotesOpen)}
                  className="flex items-center gap-2 font-semibold text-sm text-slate-900 dark:text-slate-50 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  <FileText size={16} className="text-slate-400" />
                  <span>Muistiinpanot</span>
                  {(app.notes || editedNotes) && !isNotesOpen && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500" title="Sisältää muistiinpanoja" />
                  )}
                  <ChevronDown
                    size={16}
                    className={`text-slate-400 transition-transform duration-200 ${
                      isNotesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isNotesOpen && !isEditingNotes && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingNotes(true)}
                    className="h-6 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 px-2 cursor-pointer"
                  >
                    Muokkaa
                  </Button>
                )}

                {isEditingNotes && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditedNotes(app.notes || "");
                        setIsEditingNotes(false);
                      }}
                      className="h-6 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 cursor-pointer"
                    >
                      Peruuta
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                      className="h-6 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 cursor-pointer"
                    >
                      {savingNotes ? "Tallentaa..." : "Tallenna"}
                    </Button>
                  </div>
                )}
              </div>

              {isNotesOpen && (
                <div className="animate-in fade-in duration-200">
                  {isEditingNotes ? (
                    <textarea
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      className="w-full h-24 p-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                      placeholder="Kirjoita muistiinpanoja hakemuksesta..."
                      autoFocus
                    />
                  ) : (
                    <div 
                      className="p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 text-sm h-24 overflow-y-auto cursor-pointer hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                      onClick={() => setIsEditingNotes(true)}
                    >
                      {app.notes || editedNotes ? (
                        <span className="whitespace-pre-wrap">{editedNotes || app.notes}</span>
                      ) : (
                        <span className="italic text-slate-400">
                          Ei muistiinpanoja. Klikkaa tästä lisätäksesi.
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* VÄLILEHDET */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-6">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl mb-6">
                <TabsTrigger
                  value="description"
                  className="rounded-xl text-xs md:text-sm font-medium py-2 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-sm cursor-pointer"
                >
                  Työpaikkakuvaus
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="rounded-xl text-xs md:text-sm font-medium py-2 transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-slate-900 dark:data-[state=active]:text-slate-100 data-[state=active]:shadow-sm cursor-pointer"
                >
                  Rekrytoinnin eteneminen{" "}
                  {isDemo
                    ? `(${getDemoHistoryForApp(app.id).length})`
                    : history.length > 0 && `(${history.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="description" className="focus-visible:outline-none">
                <div className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm md:text-base pt-1">
                  {app.job_description || "Ei kuvausta saatavilla."}
                </div>
              </TabsContent>

              <TabsContent value="history" className="focus-visible:outline-none">
                <div className="pt-1">
                  {isDemo ? (
                    <div>
                      <div className="mb-4 text-center text-xs font-semibold text-amber-600 dark:text-amber-400/80 bg-amber-50 dark:bg-amber-500/10 py-2 px-3 rounded-xl border border-amber-200 dark:border-amber-500/20">
                        Katsot demotilaa. Historia on esimerkki yritykselle {app.company}.
                      </div>
                      <ApplicationHistory history={getDemoHistoryForApp(app.id) as any} />
                    </div>
                  ) : loadingHistory ? (
                    <div className="text-center py-8 text-sm text-slate-400 animate-pulse">
                      Ladataan historiaa...
                    </div>
                  ) : (
                    <ApplicationHistory history={history} />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}