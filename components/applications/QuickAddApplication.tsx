"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Sparkles,
  Building2,
  Briefcase,
  MapPin,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Shadcn UI Select -tuonnit
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface QuickAddApplicationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const initialFormData = {
  company: "",
  company_logo: "",
  title: "",
  url: "",
  location: "",
  applied_date: new Date().toISOString().split("T")[0],
  date_posted: "",
  valid_through: "",
  status: "Tallennettu",
  employment_type: "Kokoaikainen",
  salary_min: "",
  salary_max: "",
  description: "",
};

export default function QuickAddApplication({
  open,
  onOpenChange,
  onSuccess,
}: QuickAddApplicationProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [showFields, setShowFields] = useState(false);
  const [formData, setFormData] = useState(initialFormData);

  const handleModalClose = () => {
    setShowFields(false);
    setFormData(initialFormData);
    onOpenChange(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value }));
  };

  async function addHistory(
    userId: string,
    applicationId: string,
    eventType: string,
    oldStatus?: string | null,
    newStatus?: string | null
  ) {
    await supabase.from("application_history").insert({
      user_id: userId,
      application_id: applicationId,
      event_type: eventType,
      old_status: oldStatus ?? null,
      new_status: newStatus ?? null,
    });
  }

  const handleAutoFill = async () => {
    if (!formData.url) {
      toast.error("Syötä ensin työpaikkailmoituksen linkki.");
      return;
    }

    setShowFields(true);
    setAutoFilling(true);

    try {
      const res = await fetch("/api/parse-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formData.url }),
      });

      const data = await res.json();

      if (res.ok) {
        setFormData((prev) => ({
          ...prev,
          title: data.title || prev.title,
          company: data.company || prev.company,
          company_logo: data.companyLogo || prev.company_logo,
          location: data.location || prev.location,
          description: data.description || prev.description,
          salary_min: data.salaryMin ? String(data.salaryMin) : prev.salary_min,
          salary_max: data.salaryMax ? String(data.salaryMax) : prev.salary_max,
          employment_type:
            data.employmentType !== "Ei määritelty"
              ? data.employmentType
              : prev.employment_type,
          valid_through: data.validThrough
            ? data.validThrough.split("T")[0]
            : prev.valid_through,
          date_posted: data.datePosted
            ? data.datePosted.split("T")[0]
            : prev.date_posted,
        }));
        toast.success("Tiedot haettu automaattisesti!");
      } else {
        toast.error(
          data.error || "Tietojen haku epäonnistui. Varmista linkki."
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Virhe haettaessa tietoja linkistä.");
    } finally {
      setAutoFilling(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error("Kirjaudu sisään lisätäksesi hakemuksen.");
        setLoading(false);
        return;
      }

      const minSalary = formData.salary_min
        ? Number(formData.salary_min)
        : null;
      const maxSalary = formData.salary_max
        ? Number(formData.salary_max)
        : null;

      if (minSalary && maxSalary && minSalary > maxSalary) {
        toast.error("Minimipalkka ei voi olla suurempi kuin maksimipalkka.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("applications")
        .insert([
          {
            user_id: session.user.id,
            company: formData.company,
            job_title: formData.title,
            job_url: formData.url || null,
            location: formData.location || null,
            applied_date: formData.applied_date,
            status: formData.status,
            company_logo: formData.company_logo || null,
            employment_type: formData.employment_type || null,
            salary_min: minSalary,
            salary_max: maxSalary,
            valid_through: formData.valid_through || null,
            job_description: formData.description || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await addHistory(
        session.user.id,
        data.id,
        "created",
        null,
        formData.status
      );

      toast.success("Hakemus tallennettu onnistuneesti!");

      setShowFields(false);
      setFormData(initialFormData);

      if (onSuccess) onSuccess();
      handleModalClose();

      router.push("/applications");
    } catch (err: any) {
      console.error("Virhe tallennettaessa:", err.message);
      toast.error("Tallennus epäonnistui: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={handleModalClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col bg-white dark:bg-[#181b26] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto"
          >
            {/* Header */}
            <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20 shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  Lisää uusi työpaikka
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tuo tiedot automaattisesti hakuilmoituksen linkistä tai syötä käsin.
                </p>
              </div>
              <button
                onClick={handleModalClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Lomake (Sopeutuu sisällön mukaan, vieritettävissä vain tarvittaessa) */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5"
            >
              {/* Osoite osio */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <label className="block text-xs font-semibold text-indigo-900 dark:text-indigo-300">
                  Hakuilmoituksen linkki
                </label>
                <div className="flex flex-col gap-2.5">
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="https://duunitori.fi/tyopaikat/..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-[#12141c] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAutoFill}
                    disabled={autoFilling}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {autoFilling ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    <span>
                      {autoFilling
                        ? "Haetaan tietoja..."
                        : "Hae tiedot automaattisesti"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Vaihtoehto syöttää tiedot käsin ilman automaattitäyttöä */}
              {!showFields && (
                <div className="text-center pt-1 pb-1">
                  <button
                    type="button"
                    onClick={() => setShowFields(true)}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline transition cursor-pointer"
                  >
                    Tai täytä hakemuksen tiedot käsin
                  </button>
                </div>
              )}

              {/* Skeleton -lataustila */}
              {showFields && autoFilling && (
                <div className="space-y-5 animate-pulse">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                      <div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
                    </div>
                    <div>
                      <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                      <div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                      <div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
                    </div>
                    <div>
                      <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                      <div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                      <div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
                    </div>
                    <div>
                      <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                      <div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
                    </div>
                    <div>
                      <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                      <div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                      <div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
                    </div>
                    <div>
                      <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                      <div className="h-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
                    </div>
                  </div>

                  <div>
                    <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded mb-2"></div>
                    <div className="h-28 bg-slate-100 dark:bg-slate-800/50 rounded-xl"></div>
                  </div>
                </div>
              )}

              {/* Varsinaiset syötekentät */}
              {showFields && !autoFilling && (
                <div className="space-y-5 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Yritys *
                      </label>
                      <div className="relative">
                        <Building2
                          size={16}
                          className="absolute left-3 top-3 text-slate-400"
                        />
                        <input
                          required
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          placeholder="Esim. Reaktor"
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Työtehtävä *
                      </label>
                      <div className="relative">
                        <Briefcase
                          size={16}
                          className="absolute left-3 top-3 text-slate-400"
                        />
                        <input
                          required
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleChange}
                          placeholder="Esim. Senior Developer"
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Hakemuksen tila
                      </label>
                      <Select
                        value={formData.status}
                        onValueChange={handleStatusChange}
                      >
                        <SelectTrigger className="w-full h-[42px] px-3 text-sm rounded-xl bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500">
                          <SelectValue placeholder="Valitse tila" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Tallennettu">Tallennettu</SelectItem>
                          <SelectItem value="Haettu">Haettu</SelectItem>
                          <SelectItem value="Haastattelu">Haastattelu</SelectItem>
                          <SelectItem value="Tarjous">Tarjous</SelectItem>
                          <SelectItem value="Hylätty">Hylätty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Paikkakunta
                      </label>
                      <div className="relative">
                        <MapPin
                          size={16}
                          className="absolute left-3 top-3 text-slate-400"
                        />
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="Helsinki / Etä"
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Hakupäivä *
                      </label>
                      <input
                        required
                        type="date"
                        name="applied_date"
                        value={formData.applied_date}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Julkaisupäivä
                      </label>
                      <input
                        type="date"
                        name="date_posted"
                        value={formData.date_posted}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Haku päättyy
                      </label>
                      <input
                        type="date"
                        name="valid_through"
                        value={formData.valid_through}
                        onChange={handleChange}
                        className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Työsuhteen tyyppi
                      </label>
                      <input
                        type="text"
                        name="employment_type"
                        value={formData.employment_type}
                        onChange={handleChange}
                        placeholder="Esim. Kokoaikainen"
                        className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Palkka / Palkkahaarukka (€/kk)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          name="salary_min"
                          placeholder="Minimi"
                          value={formData.salary_min}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                          type="number"
                          name="salary_max"
                          placeholder="Maksimi"
                          value={formData.salary_max}
                          onChange={handleChange}
                          className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Työpaikkakuvaus (Description)
                    </label>
                    <textarea
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Haettu työpaikkakuvaus..."
                      className="w-full px-3 py-2 text-sm rounded-xl bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Normaalisti rullautuva painikerivi lomakkeen lopussa */}
              {showFields && !autoFilling && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  >
                    Peruuta
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-sm active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Tallennetaan..." : "Tallenna hakemus"}
                  </button>
                </div>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}