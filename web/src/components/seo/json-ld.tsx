import { siteConfig } from "@/lib/site";

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

export function homePageJsonLd() {
  return (
    <JsonLd
      data={[
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: siteConfig.name,
          url: siteConfig.url,
          description: siteConfig.description,
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${siteConfig.url}/login`,
            },
            "query-input": "required name=search_term_string",
          },
        },
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: siteConfig.name,
          url: siteConfig.url,
          description: siteConfig.description,
          email: siteConfig.supportEmail,
        },
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Applywise Chrome Extension",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Chrome",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
          description:
            "AI job application autofill for LinkedIn, Naukri, Indeed, and 50+ job boards. Upload your resume once and fill forms in one click.",
          url: `${siteConfig.url}/extension`,
          featureList: [
            "One-click job application autofill",
            "AI resume parsing",
            "LinkedIn Easy Apply support",
            "Naukri and Indeed India support",
            "Cover letter generation",
          ],
        },
      ]}
    />
  );
}

export function extensionPageJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Applywise — Job Application Autofill",
        applicationCategory: "BrowserApplication",
        applicationSubCategory: "Productivity",
        operatingSystem: "Chrome",
        browserRequirements: "Requires Google Chrome",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description:
          "Chrome extension to autofill job applications on Naukri, LinkedIn, Indeed, Internshala, Greenhouse, Lever, and more. AI extracts your resume into a profile you reuse everywhere.",
        url: `${siteConfig.url}/extension`,
        downloadUrl: siteConfig.chromeExtensionUrl || `${siteConfig.url}/extension`,
        featureList: [
          "Autofill Naukri job applications",
          "Autofill LinkedIn Easy Apply",
          "Autofill Indeed India forms",
          "AI resume to profile extraction",
          "Cover letters from job context",
        ],
      }}
    />
  );
}
