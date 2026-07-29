import { gsap } from "gsap";
import {
  REVEAL_SEQUENCE_TIMING,
  type RevealSequencePhase
} from "./revealMachine";
import { playRevealCue } from "./sounds";

type RevealSequenceAnimationArgs = {
  getMuted: () => boolean;
  onFinish: () => void;
  root: HTMLElement;
  setPhase: (phase: RevealSequencePhase) => void;
};

const {
  dispensingAtMs,
  extractingAtMs,
  nameAtMs,
  openingAtMs,
  rarityAtMs,
  showcaseAtMs,
  summaryAtMs
} = REVEAL_SEQUENCE_TIMING;
const seconds = (milliseconds: number) => milliseconds / 1000;

function addDispenseMotion(
  timeline: gsap.core.Timeline,
  setPhase: RevealSequenceAnimationArgs["setPhase"]
) {
  setPhase("release");
  timeline
    .set(".pack-reveal-dispensed-pack", { "--pack-drop": "-18%" })
    .set(".pack-reveal-emerging-card", {
      "--card-rise": "0%",
      "--card-scale": "1",
      autoAlpha: 0
    })
    .set(
      ".pack-reveal-emerging-card-edge, .pack-reveal-reveal-rarity, .pack-reveal-reveal-name, .pack-reveal-screen-wash",
      { autoAlpha: 0 }
    )
    .to(
      ".pack-reveal-gesture-copy",
      { autoAlpha: 0, duration: 0.32, ease: "power2.out", y: 12 },
      0
    )
    .call(() => setPhase("dispensing"), [], seconds(dispensingAtMs))
    .to(
      ".pack-reveal-dispensed-pack",
      {
        duration: 1.2,
        ease: "power3.out",
        "--pack-drop": "0%"
      },
      seconds(dispensingAtMs)
    )
    .to(
      ".pack-reveal-dispensed-pack",
      { "--pack-drop": "2%", duration: 0.1, ease: "power1.in" },
      1.8
    )
    .to(
      ".pack-reveal-dispensed-pack",
      { "--pack-drop": "0%", duration: 0.1, ease: "power1.out" },
      1.9
    );
}

function addOpeningMotion(
  timeline: gsap.core.Timeline,
  getMuted: RevealSequenceAnimationArgs["getMuted"],
  setPhase: RevealSequenceAnimationArgs["setPhase"]
) {
  timeline
    .call(() => setPhase("opening"), [], seconds(openingAtMs))
    .to(
      ".pack-reveal-pack-mouth",
      {
        autoAlpha: 1,
        clipPath: "inset(0% 0% 0% 0%)",
        duration: 0.75,
        ease: "power2.out"
      },
      2.25
    )
    .call(() => playRevealCue("peel", getMuted()), [], 2.65)
    .to(
      ".pack-reveal-pack-seal",
      {
        autoAlpha: 0,
        duration: 1.15,
        ease: "power2.inOut",
        xPercent: 112
      },
      2.65
    )
    .call(() => setPhase("extracting"), [], seconds(extractingAtMs))
    .to(
      ".pack-reveal-emerging-card",
      { autoAlpha: 1, duration: 0.22, ease: "power1.out" },
      seconds(extractingAtMs)
    )
    .to(
      ".pack-reveal-emerging-card",
      {
        duration: 3.3,
        ease: "power2.inOut",
        "--card-rise": "-78%"
      },
      seconds(extractingAtMs)
    );
}

function addResultMotion(
  timeline: gsap.core.Timeline,
  getMuted: RevealSequenceAnimationArgs["getMuted"],
  setPhase: RevealSequenceAnimationArgs["setPhase"]
) {
  timeline
    .to(
      ".pack-reveal-emerging-card-edge",
      { autoAlpha: 1, duration: 0.6, ease: "power1.out" },
      seconds(rarityAtMs)
    )
    .to(
      ".pack-reveal-reveal-rarity",
      { autoAlpha: 1, duration: 0.55, ease: "power2.out", y: 0 },
      seconds(rarityAtMs)
    )
    .to(
      ".pack-reveal-reveal-name",
      { autoAlpha: 1, duration: 0.75, ease: "power2.out", y: 0 },
      seconds(nameAtMs)
    )
    .call(() => {
      setPhase("showcase");
      playRevealCue("card-front", getMuted());
    }, [], seconds(showcaseAtMs));
}

export function runRevealSequenceAnimation({
  getMuted,
  onFinish,
  root,
  setPhase
}: RevealSequenceAnimationArgs) {
  const context = gsap.context(() => {
    const timeline = gsap.timeline();
    addDispenseMotion(timeline, setPhase);
    addOpeningMotion(timeline, getMuted, setPhase);
    addResultMotion(timeline, getMuted, setPhase);
    timeline.to(
      ".pack-reveal-screen-wash",
      { autoAlpha: 1, duration: 0.3, ease: "power1.in" },
      seconds(summaryAtMs) - 0.3
    );
    timeline.call(onFinish, [], seconds(summaryAtMs));
  }, root);

  return () => context.revert();
}
