import type { JobListing, JobList } from "./types";

export const JOB_LISTINGS: JobListing[] = [
  {
    id: "j1",
    title: "Senior Software Engineer",
    company: "Stripe",
    location: "San Francisco, CA",
    salary: "$180k - $240k",
    type: "Full-time",
    remote: true,
    description:
      "Build payment infrastructure at scale. Work on APIs, distributed systems, and developer experience. 5+ years experience with backend systems required.",
    skills: ["Go", "Ruby", "Distributed Systems", "PostgreSQL", "AWS"],
    postedAt: "2 days ago",
    logo: "S",
    url: "https://stripe.com/jobs",
  },
  {
    id: "j2",
    title: "Product Manager",
    company: "Notion",
    location: "New York, NY",
    salary: "$150k - $200k",
    type: "Full-time",
    remote: true,
    description:
      "Drive product strategy for collaboration features. Partner with engineering and design to ship delightful user experiences.",
    skills: ["Product Strategy", "User Research", "Roadmapping", "SQL"],
    postedAt: "1 day ago",
    logo: "N",
    url: "https://notion.so/careers",
  },
  {
    id: "j3",
    title: "Frontend Engineer",
    company: "Vercel",
    location: "Remote",
    salary: "$140k - $190k",
    type: "Full-time",
    remote: true,
    description:
      "Build the next generation of web development tools. React, TypeScript, and performance optimization expertise required.",
    skills: ["React", "TypeScript", "Next.js", "CSS", "Performance"],
    postedAt: "3 days ago",
    logo: "V",
    url: "https://vercel.com/careers",
  },
  {
    id: "j4",
    title: "Data Scientist",
    company: "Spotify",
    location: "Stockholm, Sweden",
    salary: "€70k - €95k",
    type: "Full-time",
    remote: false,
    description:
      "Apply ML to personalize music recommendations. Work with petabyte-scale data and cutting-edge recommendation systems.",
    skills: ["Python", "Machine Learning", "Spark", "Statistics"],
    postedAt: "5 days ago",
    logo: "Sp",
    url: "https://lifeatspotify.com",
  },
  {
    id: "j5",
    title: "Software Engineering Intern",
    company: "Jane Street",
    location: "New York, NY",
    salary: "$120/hr",
    type: "Internship",
    remote: false,
    description:
      "Summer internship working on trading systems. Strong CS fundamentals and functional programming experience preferred.",
    skills: ["OCaml", "Python", "Algorithms", "Linux"],
    postedAt: "1 week ago",
    logo: "JS",
    url: "https://janestreet.com/join-jane-street",
  },
  {
    id: "j6",
    title: "DevOps Engineer",
    company: "Datadog",
    location: "Boston, MA",
    salary: "$130k - $175k",
    type: "Full-time",
    remote: true,
    description:
      "Scale observability infrastructure. Kubernetes, Terraform, and CI/CD pipeline expertise. On-call rotation included.",
    skills: ["Kubernetes", "Terraform", "AWS", "Python", "CI/CD"],
    postedAt: "4 days ago",
    logo: "D",
    url: "https://careers.datadoghq.com",
  },
  {
    id: "j7",
    title: "UX Designer",
    company: "Figma",
    location: "San Francisco, CA",
    salary: "$130k - $170k",
    type: "Full-time",
    remote: true,
    description:
      "Design intuitive creative tools used by millions. Strong portfolio in complex product design required.",
    skills: ["Figma", "User Research", "Prototyping", "Design Systems"],
    postedAt: "2 days ago",
    logo: "F",
    url: "https://figma.com/careers",
  },
  {
    id: "j8",
    title: "Backend Engineer",
    company: "Discord",
    location: "Remote",
    salary: "$160k - $210k",
    type: "Full-time",
    remote: true,
    description:
      "Build real-time communication infrastructure serving millions of concurrent users. Rust or Elixir experience a plus.",
    skills: ["Rust", "Elixir", "Real-time Systems", "PostgreSQL"],
    postedAt: "6 days ago",
    logo: "Di",
    url: "https://discord.com/jobs",
  },
  {
    id: "j9",
    title: "New Grad Software Engineer",
    company: "Google",
    location: "Mountain View, CA",
    salary: "$140k - $180k",
    type: "New Grad",
    remote: false,
    description:
      "Join Google's engineering residency program. Work on products used by billions. BS/MS in CS required.",
    skills: ["Java", "Python", "C++", "Algorithms", "System Design"],
    postedAt: "3 days ago",
    logo: "G",
    url: "https://careers.google.com",
  },
  {
    id: "j10",
    title: "Machine Learning Engineer",
    company: "OpenAI",
    location: "San Francisco, CA",
    salary: "$200k - $350k",
    type: "Full-time",
    remote: false,
    description:
      "Train and deploy large language models. Deep learning, PyTorch, and distributed training experience required.",
    skills: ["PyTorch", "Deep Learning", "Python", "CUDA", "NLP"],
    postedAt: "1 day ago",
    logo: "O",
    url: "https://openai.com/careers",
  },
  {
    id: "j11",
    title: "Security Engineer",
    company: "Cloudflare",
    location: "Austin, TX",
    salary: "$150k - $200k",
    type: "Full-time",
    remote: true,
    description:
      "Protect the internet at the edge. Application security, threat detection, and incident response.",
    skills: ["Security", "Python", "Networking", "Cryptography"],
    postedAt: "1 week ago",
    logo: "C",
    url: "https://cloudflare.com/careers",
  },
  {
    id: "j12",
    title: "Business Analyst",
    company: "Deloitte",
    location: "Chicago, IL",
    salary: "$75k - $95k",
    type: "Full-time",
    remote: false,
    description:
      "Consult on digital transformation projects for Fortune 500 clients. Strong analytical and communication skills.",
    skills: ["Excel", "SQL", "PowerPoint", "Consulting", "Analytics"],
    postedAt: "4 days ago",
    logo: "De",
    url: "https://deloitte.com/careers",
  },
];

export const CURATED_LISTS: JobList[] = [
  {
    id: "list1",
    title: "Top Summer 2026 Internships",
    description: "Hand-picked internship programs at top tech companies",
    icon: "☀️",
    jobIds: ["j5", "j9"],
  },
  {
    id: "list2",
    title: "Senior Engineering at Unicorns",
    description: "Senior roles at high-growth startups valued over $1B",
    icon: "🦄",
    jobIds: ["j1", "j8", "j10"],
  },
  {
    id: "list3",
    title: "Remote-First Opportunities",
    description: "Fully remote roles with competitive compensation",
    icon: "🌍",
    jobIds: ["j3", "j6", "j8"],
  },
  {
    id: "list4",
    title: "New Grad & Entry Level",
    description: "Perfect for recent graduates and early career professionals",
    icon: "🎓",
    jobIds: ["j5", "j9", "j12"],
  },
  {
    id: "list5",
    title: "AI & Machine Learning",
    description: "Cutting-edge roles in artificial intelligence",
    icon: "🤖",
    jobIds: ["j4", "j10"],
  },
  {
    id: "list6",
    title: "Product & Design",
    description: "Shape products millions of people use every day",
    icon: "🎨",
    jobIds: ["j2", "j7"],
  },
];

export function getJobById(id: string): JobListing | undefined {
  return JOB_LISTINGS.find((j) => j.id === id);
}

export function getJobsForList(listId: string): JobListing[] {
  const list = CURATED_LISTS.find((l) => l.id === listId);
  if (!list) return [];
  return list.jobIds
    .map((id) => getJobById(id))
    .filter((j): j is JobListing => !!j);
}
