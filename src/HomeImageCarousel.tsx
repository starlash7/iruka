import { useRef, useState } from "react";

type HomeImageCarouselProps = {
  images: readonly string[];
  label: string;
};

export function HomeImageCarousel({ images, label }: HomeImageCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function handleScroll() {
    const track = trackRef.current;

    if (!track || track.clientWidth === 0) {
      return;
    }

    const nextIndex = Math.min(
      images.length - 1,
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

  return (
    <>
      <div aria-label={label} aria-roledescription="carousel" className="home-character" role="region">
        <div className="home-character-track" onScroll={handleScroll} ref={trackRef}>
          {images.map((image, index) => (
            <div
              aria-label={`${index + 1} / ${images.length}`}
              aria-roledescription="slide"
              className="home-character-slide"
              key={`${image}-${index}`}
              role="group"
            >
              <span className="home-character-card">
                <img alt="" decoding="async" draggable="false" src={image} />
              </span>
            </div>
          ))}
        </div>
      </div>

      {images.length > 1 ? (
        <div aria-label={label} className="home-carousel-dots">
          {images.map((image, index) => (
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
