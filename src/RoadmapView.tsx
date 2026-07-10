import roadmapIrukaVendingImage from "./assets/roadmap-iruka-vending.jpg";
import { roadmapContent } from "./roadmapContent";

type RoadmapViewProps = {
  locale: "en" | "ko";
};

const roadmapPhaseImages: Array<string | undefined> = [roadmapIrukaVendingImage];

export function RoadmapView({ locale }: RoadmapViewProps) {
  const content = roadmapContent[locale];

  return (
    <section className="roadmap-section" id="roadmap">
      <div className="section-heading roadmap-heading">
        <h2>
          {content.heading.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </h2>
      </div>

      <div className="roadmap-phases">
        {content.phases.map((title, index) => {
          const image = roadmapPhaseImages[index];

          return (
            <article className={`roadmap-card roadmap-phase roadmap-phase-${index + 1}`} key={title}>
              <div className="roadmap-card-media" aria-hidden="true">
                {image ? <img alt="" decoding="async" src={image} /> : null}
              </div>
              <div className="roadmap-phase-copy">
                <span>PHASE {String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
