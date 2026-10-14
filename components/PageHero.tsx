import { LucideIcon } from "lucide-react";

interface PageHeroProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PageHero({
  icon: Icon,
  title,
  subtitle,
  description,
  children,
}: PageHeroProps) {
  return (
    <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div className="flex items-center gap-3 mb-4">
          {/* Tyylikäs ja näyttävä ikonilaatikko */}
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 shrink-0">
            <Icon size={23} />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              {title}
            </h1>

            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {description && (
          <p className="max-w-2xl text-slate-600 dark:text-slate-400 leading-relaxed text-sm sm:text-base">
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {children}
        </div>
      )}
    </div>
  );
}