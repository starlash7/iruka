export type Locale = "en" | "ko";

export type DocsSection = {
  body?: string;
  bullets?: string[];
  title: string;
};

export type DocsPage = {
  category: string;
  sections: DocsSection[];
  slug: string;
  summary: string;
  title: string;
};
