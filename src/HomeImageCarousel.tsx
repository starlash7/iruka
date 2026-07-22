import { useRef, useState, type PointerEvent } from "react";

type HomeImageCarouselProps = {
  images: readonly string[];
  label: string;
};

export function HomeImageCarousel({ images, label }: HomeImageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = [...new Set(images)];

  function handleScroll() {
    const track = trackRef.current;

    if (!track || track.clientWidth === 0) {
      return;
    }

    const nextIndex = Math.min(
      slides.length - 1,
      Math.max(0, Math.round(track.scrollLeft / track.clientWidth))
    );

    setActiveIndex((currentIndex) => (currentIndex === nextIndex ? currentIndex : nextIndex));
  }

  function showImage(index: number) {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    track.scrollTo({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      left: track.clientWidth * index
    });
    setActiveIndex(index);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const motion = event.currentTarget.querySelector<HTMLElement>(".home-character-motion");

    if (!motion || bounds.width === 0 || bounds.height === 0) {
      return;
    }

    const horizontal = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    const vertical = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;

    motion.style.setProperty("--character-motion-x", `${horizontal * 14}px`);
    motion.style.setProperty("--character-motion-y", `${vertical * 10}px`);
    motion.style.setProperty("--character-tilt-x", `${horizontal * 3.5}deg`);
    motion.style.setProperty("--character-tilt-y", `${vertical * -2.5}deg`);
  }

  function handlePointerLeave(event: PointerEvent<HTMLDivElement>) {
    const motion = event.currentTarget.querySelector<HTMLElement>(".home-character-motion");

    motion?.style.removeProperty("--character-motion-x");
    motion?.style.removeProperty("--character-motion-y");
    motion?.style.removeProperty("--character-tilt-x");
    motion?.style.removeProperty("--character-tilt-y");
  }

  return (
    <>
      <div aria-label={label} aria-roledescription="carousel" className="home-character" role="region">
        <div className="home-character-track" onScroll={handleScroll} ref={trackRef}>
          {slides.map((image, index) => (
            <div
              aria-label={`${index + 1} / ${slides.length}`}
              aria-roledescription="slide"
              className="home-character-slide"
              key={`${image}-${index}`}
              onPointerLeave={handlePointerLeave}
              onPointerMove={handlePointerMove}
              role="group"
            >
              <span className="home-character-motion">
                <span className="home-character-card">
                  <img alt="" decoding="async" draggable="false" src={image} />
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <div aria-label={label} className="home-carousel-dots">
          {slides.map((image, index) => (
            <button
              aria-label={`${label} ${index + 1}`}
              aria-current={activeIndex === index ? "true" : undefined}
              className={activeIndex === index ? "is-active" : undefined}
              key={`${image}-dot-${index}`}
              onClick={() => showImage(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </>
  );
}
