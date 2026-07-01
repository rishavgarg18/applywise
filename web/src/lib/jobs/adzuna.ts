export interface AdzunaJob {
  id: string;
  title: string;
  description: string;
  created: string;
  redirect_url: string;
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  category?: { label?: string };
}

export interface AdzunaSearchResponse {
  count: number;
  results: AdzunaJob[];
}

export interface AdzunaSearchParams {
  country: string;
  page: number;
  what?: string;
  where?: string;
  resultsPerPage?: number;
  fullTime?: boolean;
  salaryMin?: number;
}

function adzunaCredentials() {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return null;
  return { appId, appKey };
}

export function isAdzunaConfigured(): boolean {
  return adzunaCredentials() !== null;
}

export async function searchAdzunaJobs(
  params: AdzunaSearchParams
): Promise<AdzunaSearchResponse> {
  const creds = adzunaCredentials();
  if (!creds) {
    throw new Error("Adzuna API credentials are not configured");
  }

  const {
    country,
    page,
    what,
    where,
    resultsPerPage = 20,
    fullTime,
    salaryMin,
  } = params;

  const url = new URL(
    `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`
  );
  url.searchParams.set("app_id", creds.appId);
  url.searchParams.set("app_key", creds.appKey);
  url.searchParams.set("results_per_page", String(resultsPerPage));
  url.searchParams.set("content-type", "application/json");

  if (what?.trim()) url.searchParams.set("what", what.trim());
  if (where?.trim()) url.searchParams.set("where", where.trim());
  if (fullTime) url.searchParams.set("full_time", "1");
  if (salaryMin && salaryMin > 0) {
    url.searchParams.set("salary_min", String(Math.floor(salaryMin)));
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Adzuna API error ${res.status}: ${body.slice(0, 200)}`);
  }

  return res.json() as Promise<AdzunaSearchResponse>;
}

export function defaultAdzunaCountry(): string {
  return process.env.ADZUNA_COUNTRY || "in";
}
