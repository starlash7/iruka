import { useEffect, useState } from "react";

const SCRAMBLE_DURATION_MS = 2000;
const GLITCH_INTERVAL_MS = 42;
const UPPERCASE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE_CHARACTERS = "abcdefghijklmnopqrstuvwxyz";

type HomeScrambleTextProps = {
  className?: string;
  text: string;
};

function getScrambleCharacter(character: string) {
  if (character === " ") {
    return character;
  }

  const characters = character === character.toUpperCase()
    ? UPPERCASE_CHARACTERS
    : LOWERCASE_CHARACTERS;

  return characters[Math.floor(Math.random() * characters.length)];
}

export function HomeScrambleText({ className, text }: HomeScrambleTextProps) {
  const [lockedCount, setLockedCount] = useState(0);
  const [activeCharacter, setActiveCharacter] = useState<string | null>(null);

  useEffect(() => {
    const characters = Array.from(text);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLockedCount(characters.length);
      setActiveCharacter(null);
      return undefined;
    }

    const characterDuration = SCRAMBLE_DURATION_MS / Math.max(
      characters.filter((character) => character !== " ").length,
      1
    );
    let cancelled = false;
    let timeoutId: number | undefined;

    const showCharacter = (index: number) => {
      if (cancelled) {
        return;
      }

      if (index >= characters.length) {
        setLockedCount(characters.length);
        setActiveCharacter(null);
        return;
      }

      const character = characters[index];
      if (character === " ") {
        setLockedCount(index + 1);
        showCharacter(index + 1);
        return;
      }

      const endTime = performance.now() + characterDuration;
      const scrambleCharacter = () => {
        if (cancelled) {
          return;
        }

        if (performance.now() >= endTime) {
          setLockedCount(index + 1);
          showCharacter(index + 1);
          return;
        }

        setActiveCharacter(getScrambleCharacter(character));
        timeoutId = window.setTimeout(scrambleCharacter, GLITCH_INTERVAL_MS);
      };

      scrambleCharacter();
    };

    setLockedCount(0);
    setActiveCharacter(null);
    showCharacter(0);

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [text]);

  return (
    <p aria-label={text} className={className}>
      <span aria-hidden="true">
        {Array.from(text, (character, index) => {
          if (index < lockedCount) {
            return <span key={index}>{character}</span>;
          }

          if (index === lockedCount && activeCharacter !== null) {
            return <span key={index}>{activeCharacter}</span>;
          }

          return null;
        })}
      </span>
    </p>
  );
}
