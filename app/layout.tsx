import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ModalProvider } from "@/components/logout/ModalProvider";
import AppToaster from "@/components/ui/AppToaster";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? "https://duunify.com"
      : "http://localhost:3000",
  ),
  title: {
    default: "Duunify | Älykäs työhakemusten hallinta ja työnhakutyökalu",
    template: "%s | Duunify",
  },
  description:
    "Duunify on moderni työnhakutyökalu, jolla hallitset työhakemuksesi, seuraat prosessia ja pysyt ajan tasalla työnhaussasi. Aloita ilmaiseksi ja tehosta työnhakuasi.",
  keywords: [
    "työnhaku",
    "työhakemus",
    "hakemusten hallinta",
    "työnhakutyökalu",
    "CV",
    "Duunify",
  ],
  authors: [{ name: "Duunify Team" }],
  creator: "Duunify",
  verification: {
    google: "fpyl3h3YkL2JU_xiQqV3QZxuS3ASm1_ydibzrBU-cww",
  },
  openGraph: {
    type: "website",
    url: "https://duunify.com",
    title: "Duunify | Älykäs työhakemusten hallinta",
    description:
      "Hallitse työhakemuksiasi helposti ja pysy ajan tasalla työnhaussasi.",
    siteName: "Duunify",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Duunify | Älykäs työhakemusten hallinta",
    description: "Tehosta työnhakuasi Duunifyn avulla.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://duunify.com",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fi"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head />
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
        >
          <ModalProvider>{children}</ModalProvider>
        </ThemeProvider>
        <AppToaster />
      </body>
    </html>
  );
}
