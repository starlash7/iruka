import { ArrowRight, Check, Clock3, Users } from "lucide-react";
import { roadmapContent } from "./roadmapContent";

type RoadmapViewProps = {
  heading: string;
  locale: "en" | "ko";
};

const phaseIcons = [Check, ArrowRight, Clock3];

export function RoadmapView({ heading, locale }: RoadmapViewProps) {
  const content = roadmapContent[locale];

  return (
    <section className="roadmap-section" id="roadmap">
      <div className="section-heading">
        <h2>{heading}</h2>
      </div>
      <p className="section-intro">{content.intro}</p>

      <div className="roadmap-phases">
        {content.phases.map((phase, index) => {
          const Icon = phaseIcons[index] ?? Check;

          return (
            <article className="roadmap-card roadmap-phase" key={phase.title}>
              <span>{phase.title}</span>
              <ul>
                {phase.items.map((item) => (
                  <li key={item}>
                    <Icon size={15} />
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>

      <div className="brand-callout">
        <span className="brand-callout-icon">
          <Users size={20} />
        </span>
        <div>
          <strong>{content.community.title}</strong>
          <p>{content.community.body}</p>
        </div>
      </div>
    </section>
  );
}
