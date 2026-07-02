import type { Metadata } from "next";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { ProductShowcase } from "@/components/landing/product-showcase";
import { StatsBar } from "@/components/landing/stats-bar";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { homePageJsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Applywise — AI Job Search, Resume Autofill & Application Tracker",
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: "Applywise — AI Job Search Companion",
    description: siteConfig.description,
    url: absoluteUrl("/"),
    siteName: siteConfig.name,
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: "Applywise — AI Job Search Companion",
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export default function LandingPage() {
  return (
    <>
      {homePageJsonLd()}
      <Navbar />
      <main>
        <Hero />
        <ProductShowcase />
        <StatsBar />
        <HowItWorks />
        <Features />
        <Testimonials />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
