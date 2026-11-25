import React from "react";

interface CompanyLogoProps {
  logo?: string | null;
  company: string;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "h-10 w-10 text-sm rounded-xl",
  md: "h-12 w-12 text-base rounded-2xl",
  lg: "h-14 w-14 sm:h-16 sm:w-16 text-lg sm:text-xl rounded-2xl",
};

export function CompanyLogo({
  logo,
  company,
  size = "lg",
}: CompanyLogoProps) {
  const initials = company
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizeClass = SIZE_CLASSES[size];

  if (logo) {
    return (
      <img
        src={logo}
        alt={company}
        className={`${sizeClass} shrink-0 object-contain bg-white border border-slate-100 dark:border-slate-800`}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  const hue = (company.charCodeAt(0) * 37) % 360;
  const bgColors = [
    "bg-violet-100",
    "bg-teal-100",
    "bg-rose-100",
    "bg-sky-100",
    "bg-amber-100",
    "bg-emerald-100",
  ];
  const textColors = [
    "text-violet-700",
    "text-teal-700",
    "text-rose-700",
    "text-sky-700",
    "text-amber-700",
    "text-emerald-700",
  ];

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center font-semibold ${bgColors[hue % bgColors.length]} ${textColors[hue % textColors.length]}`}
    >
      {initials}
    </div>
  );
}