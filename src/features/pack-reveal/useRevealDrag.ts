import {
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useRef
} from "react";
import { shouldCompleteRevealDrag } from "./revealMachine";

const handleInset = 6;
const handleWidth = 44;
const returnDurationMs = 220;

export function useRevealDrag(onOpen: () => void) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number>();
  const openTimerRef = useRef<number>();
  const returnTimerRef = useRef<number>();
  const openedRef = useRef(false);
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    progress: 0,
    travel: 0
  });

  useEffect(() => {
    return () => {
      window.cancelAnimationFrame(frameRef.current ?? 0);
      window.clearTimeout(openTimerRef.current);
      window.clearTimeout(returnTimerRef.current);
    };
  }, []);

  function paintProgress(
    progress: number,
    travel = dragRef.current.travel
  ) {
    dragRef.current.progress = progress;
    window.cancelAnimationFrame(frameRef.current ?? 0);
    frameRef.current = window.requestAnimationFrame(() => {
      const scene = sceneRef.current;
      scene?.style.setProperty("--drag-progress", `${progress}`);
      scene?.style.setProperty("--drag-x", `${progress * travel}px`);
    });
  }

  function getDragTravel() {
    const width = trackRef.current?.getBoundingClientRect().width ?? 0;
    return Math.max(width - handleWidth - handleInset * 2, 1);
  }

  function updateDrag(clientX: number) {
    const bounds = trackRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const travel = getDragTravel();
    dragRef.current.travel = travel;
    const progress = Math.min(
      1,
      Math.max(
        0,
        (
          clientX
          - bounds.left
          - handleInset
          - handleWidth / 2
        ) / travel
      )
    );
    paintProgress(progress, travel);
  }

  function resetDrag() {
    const scene = sceneRef.current;
    scene?.setAttribute("data-returning", "true");
    paintProgress(0);
    window.clearTimeout(returnTimerRef.current);
    returnTimerRef.current = window.setTimeout(() => {
      scene?.removeAttribute("data-returning");
    }, returnDurationMs);
  }

  function completeDrag() {
    if (openedRef.current) return;
    openedRef.current = true;
    sceneRef.current?.setAttribute("data-open", "true");
    if (dragRef.current.travel === 0) {
      dragRef.current.travel = getDragTravel();
    }
    paintProgress(1);
    openTimerRef.current = window.setTimeout(onOpen, 180);
  }

  function releasePointer(event: PointerEvent<HTMLButtonElement>) {
    dragRef.current.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (openedRef.current || (event.button !== 0 && event.pointerType === "mouse")) {
      return;
    }
    dragRef.current.active = true;
    dragRef.current.pointerId = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateDrag(event.clientX);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (
      !dragRef.current.active
      || dragRef.current.pointerId !== event.pointerId
    ) {
      return;
    }
    updateDrag(event.clientX);
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (dragRef.current.pointerId !== event.pointerId) return;
    releasePointer(event);
    if (shouldCompleteRevealDrag(dragRef.current.progress)) {
      completeDrag();
    } else {
      resetDrag();
    }
  }

  function handlePointerCancel(event: PointerEvent<HTMLButtonElement>) {
    if (dragRef.current.pointerId !== event.pointerId) return;
    releasePointer(event);
    resetDrag();
  }

  function handleLostPointerCapture(event: PointerEvent<HTMLButtonElement>) {
    if (
      dragRef.current.active
      && dragRef.current.pointerId === event.pointerId
    ) {
      dragRef.current.active = false;
      resetDrag();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      completeDrag();
    }
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (event.detail === 0) completeDrag();
  }

  return {
    handleClick,
    handleKeyDown,
    handleLostPointerCapture,
    handlePointerCancel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    sceneRef,
    trackRef
  };
}
