import { BookOpen, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { docsPagesEn } from "./docsContent.en";
import { docsPagesKo } from "./docsContent.ko";
import type { Locale } from "./docsContent";

type DocsViewCopy = {
  body: string;
  eyebrow: string;
  sourceBody: string;
  sourcePath: string;
  sourceTitle: string;
  title: string;
};

type DocsViewProps = {
  copy: DocsViewCopy;
  locale: Locale;
};

export function DocsView({ copy, locale }: DocsViewProps) {
  const pages = locale === "ko" ? docsPagesKo : docsPagesEn;
  const [selectedSlug, setSelectedSlug] = useState(pages[0].slug);
  const selectedPage = useMemo(
    () => pages.find((page) => page.slug === selectedSlug) ?? pages[0],
    [pages, selectedSlug]
  );

  return (
    <section className="docs-section" id="docs">
      <div className="docs-page-heading">
        <span>{copy.eyebrow}</span>
        <h1>{copy.title}</h1>
        <p>{copy.body}</p>
      </div>

      <div className="docs-shell">
        <aside className="docs-sidebar" aria-label={copy.title}>
          <div className="docs-sidebar-title">
            <BookOpen size={16} />
            <strong>GitBook Preview</strong>
          </div>
          {pages.map((page) => (
            <button
              className={page.slug === selectedPage.slug ? "selected" : ""}
              key={page.slug}
              onClick={() => setSelectedSlug(page.slug)}
              type="button"
            >
              <span>{page.category}</span>
              <strong>{page.title}</strong>
            </button>
          ))}
        </aside>

        <article className="docs-article">
          <div className="docs-article-head">
            <span>{selectedPage.category}</span>
            <h2>{selectedPage.title}</h2>
            <p>{selectedPage.summary}</p>
          </div>

          {selectedPage.sections.map((section) => (
            <section className="docs-article-section" key={section.title}>
              <h3>{section.title}</h3>
              {section.body ? <p>{section.body}</p> : null}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((item) => (
                    <li key={item}>
                      <ChevronRight size={14} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}

          <div className="docs-source">
            <strong>{copy.sourceTitle}</strong>
            <p>{copy.sourceBody}</p>
            <code>{copy.sourcePath}</code>
          </div>
        </article>
      </div>
    </section>
  );
}
