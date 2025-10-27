import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "UPSC Aspirant Platform - AI-Powered UPSC Exam Preparation",
    template: "%s | UPSC Aspirant Platform",
  },
  description: "Comprehensive UPSC exam preparation platform with AI-powered chatbot, copy checking for GS and Essay papers, personalized current affairs, tips & tricks, mock tests, and smart study tools. Prepare smarter with AI assistance.",
  keywords: [
    "UPSC preparation",
    "UPSC exam",
    "IAS preparation",
    "civil services exam",
    "UPSC chatbot",
    "answer copy checking",
    "current affairs",
    "UPSC tips",
    "mock tests",
    "AI study assistant",
    "General Studies",
    "Essay writing",
    "UPSC notes",
    "revision scheduler",
  ],
  authors: [{ name: "UPSC Aspirant Platform" }],
  creator: "UPSC Aspirant Platform",
  publisher: "UPSC Aspirant Platform",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    title: "UPSC Aspirant Platform - AI-Powered UPSC Exam Preparation",
    description: "Comprehensive UPSC exam preparation platform with AI-powered chatbot, copy checking, current affairs, and smart study tools.",
    siteName: "UPSC Aspirant Platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "UPSC Aspirant Platform - AI-Powered UPSC Exam Preparation",
    description: "Comprehensive UPSC exam preparation platform with AI-powered chatbot, copy checking, current affairs, and smart study tools.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="overflow-x-hidden">
        <body className={`${inter.className} overflow-x-hidden`}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            Skip to main content
          </a>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
