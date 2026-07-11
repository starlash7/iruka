import eventComingSoonImage from "./assets/event-coming-soon.jpg";

type EventsViewProps = {
  copy: {
    heading: string;
    items: readonly [string, string, string];
    title: string;
  };
};

export function EventsView({ copy }: EventsViewProps) {
  return (
    <section aria-label={copy.title} className="events-section">
      <div className="events-content">
        <img alt="" decoding="async" src={eventComingSoonImage} />
        <div className="events-copy">
          <h1>{copy.heading}</h1>
          <ul>
            {copy.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
