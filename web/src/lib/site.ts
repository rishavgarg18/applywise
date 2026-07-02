/** Public site URL — set NEXT_PUBLIC_SITE_URL in production (custom domain). */
export const siteConfig = {
  name: "Applywise",
  tagline: "Your AI job search companion. Built around one profile.",
  description:
    "Applywise helps you search matched jobs, parse your resume with AI, autofill applications on Naukri, LinkedIn, and Indeed, and track your pipeline — from one profile.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://applywise-drab.vercel.app",
  chromeExtensionUrl:
    process.env.NEXT_PUBLIC_CHROME_EXTENSION_URL || "",
  keywords: [
    "job application autofill",
    "chrome extension job apply",
    "naukri autofill extension",
    "linkedin easy apply autofill",
    "indeed autofill india",
    "resume parser ai",
    "job search tracker",
    "ats resume checker",
    "cover letter generator",
    "job application assistant",
    "apply jobs faster",
    "career copilot",
  ],
  twitterHandle: "@applywise",
  supportEmail: "support@applywise.app",
};

export function absoluteUrl(path: string) {
  const base = siteConfig.url;
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
