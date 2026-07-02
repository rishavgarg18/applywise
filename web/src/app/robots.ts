import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/extension", "/login", "/privacy"],
      disallow: ["/app/", "/api/", "/onboarding"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
