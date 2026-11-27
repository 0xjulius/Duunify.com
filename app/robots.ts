import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://duunify.com"
      : "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/demo", "/changelog", "/contact", "/privacy", "/tos"],
        disallow: [
          "/admin",
          "/api/",
          "/applications",
          "/auth/",
          "/banned",
          "/calendar",
          "/dashboard",
          "/favorites",
          "/history",
          "/job-assistant",
          "/login",
          "/logout",
          "/settings",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}