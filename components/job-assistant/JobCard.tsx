import Link from "next/link";
import {
  Building2,
  MapPin,
  Briefcase,
  Clock3,
  ChevronRight,
} from "lucide-react";

export type SavedJob = {
  id: string;
  job_title: string;
  company: string;
  location: string;
  employment_type?: string;
  created_at?: string;
  description?: string;
  tags?: string[];
  status?: string;
  company_logo?: string;
};

interface JobCardProps {
  job: SavedJob;
  hasLogoFailed: boolean;
  onImageError: (id: string) => void;
}

const formatDate = (dateString?: string) => {
  if (!dateString) return "Äskettäin";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fi-FI", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  } catch (e) {
    return "Äskettäin";
  }
};

function MetaChip({
  icon,
  children,
  customStyle = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  customStyle?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${customStyle}`}
    >
      {icon}
      {children}
    </span>
  );
}

export function JobCard({ job, hasLogoFailed, onImageError }: JobCardProps) {
  return (
    <Link href={`/job-assistant/${job.id}`} className="group block">
      <div className="relative rounded-3xl bg-white dark:bg-[#151826] border border-slate-300 dark:border-slate-800 p-5 sm:p-6 shadow-md hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center gap-5">
          {/* COMPANY ICON / LOGO */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-center shrink-0 overflow-hidden">
              {job.company_logo && !hasLogoFailed ? (
                <img
                  src={job.company_logo}
                  alt={`${job.company} logo`}
                  className="w-full h-full object-contain p-1.5"
                  onError={() => onImageError(job.id)}
                />
              ) : (
                <Building2
                  size={22}
                  className="text-slate-500 dark:text-slate-400"
                />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                {job.job_title}
              </h3>

              <p className="font-medium text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                {job.company}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                {job.location && (
                  <MetaChip
                    icon={<MapPin size={13} className="text-indigo-500 shrink-0" />}
                  >
                    {job.location}
                  </MetaChip>
                )}

                {job.employment_type && (
                  <MetaChip
                    icon={<Briefcase size={13} className="text-slate-400 shrink-0" />}
                  >
                    {job.employment_type}
                  </MetaChip>
                )}

                {job.created_at && (
                  <MetaChip
                    icon={<Clock3 size={13} className="text-blue-500 shrink-0" />}
                    customStyle="bg-blue-50 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30"
                  >
                    Tallennettu {formatDate(job.created_at)}
                  </MetaChip>
                )}
              </div>
            </div>
          </div>

          {/* TAGS */}
          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 lg:max-w-xs">
              {job.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* ACTION BUTTON */}
          <div className="flex items-center justify-end lg:justify-center shrink-0">
            <span className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 group-hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold shadow-xs group-hover:shadow transition-all duration-200">
              Valitse
              <ChevronRight
                size={18}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </span>
          </div>
        </div>

        {/* DESCRIPTION */}
        {job.description && (
          <div className="mt-4 lg:ml-16">
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              {job.description}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}