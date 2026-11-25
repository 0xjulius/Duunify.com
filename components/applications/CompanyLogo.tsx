"use client";

import React, { useEffect, useState } from "react";

interface CompanyLogoProps {
  logo?: string | null;
  company: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "h-9 w-9 text-xs rounded-xl",
  md: "h-12 w-12 text-sm rounded-2xl",
  lg: "h-14 w-14 sm:h-16 sm:w-16 text-base sm:text-lg rounded-2xl",
};

const BG_COLORS = [
  "bg-violet-100",
  "bg-teal-100",
  "bg-rose-100",
  "bg-sky-100",
  "bg-amber-100",
  "bg-emerald-100",
];

const TEXT_COLORS = [
  "text-violet-700",
  "text-teal-700",
  "text-rose-700",
  "text-sky-700",
  "text-amber-700",
  "text-emerald-700",
];

export function CompanyLogo({
  logo,
  company,
  size = "md",
}: CompanyLogoProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const normalizedLogo = typeof logo === "string" ? logo.trim() : "";

  useEffect(() => {
    setImgFailed(false);
  }, [normalizedLogo]);

  const trimmedCompany = (company || "?").trim();
  const initials =
    trimmedCompany
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const sizeClass = SIZE_CLASSES[size];

  if (normalizedLogo && !imgFailed) {
    return (
      <div
        className={`${sizeClass} shrink-0 overflow-hidden bg-white p-1.5 flex items-center justify-center border border-slate-200/80 dark:border-slate-700/80 shadow-2xs`}
      >
        <img
          src={normalizedLogo}
          alt={trimmedCompany}
          className="max-h-full max-w-full w-auto h-auto object-contain"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  const charCode = trimmedCompany.charCodeAt(0) || 65;
  const colorIndex = ((charCode * 37) % BG_COLORS.length + BG_COLORS.length) % BG_COLORS.length;

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center font-semibold select-none ${BG_COLORS[colorIndex]} ${TEXT_COLORS[colorIndex]}`}
    >
      {initials}
    </div>
  );
}