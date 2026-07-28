import { Component, type ReactNode } from "react";
import { useRevealDialog } from "./useRevealDialog.ts";

type PackRevealBoundaryProps = {
  children: ReactNode;
  continueLabel: string;
  onComplete: () => void;
};

type PackRevealBoundaryState = {
  failed: boolean;
};

function PackRevealFailure({
  continueLabel,
  onComplete
}: Omit<PackRevealBoundaryProps, "children">) {
  const { continueButtonRef, overlayRef } = useRevealDialog(true);

  return (
    <section
      aria-label="Pack reveal"
      aria-modal="true"
      className="pack-reveal-overlay pack-reveal-failed"
      ref={overlayRef}
      role="dialog"
      tabIndex={-1}
    >
      <div className="pack-reveal-fallback">
        <button
          className="pack-reveal-continue"
          onClick={onComplete}
          ref={continueButtonRef}
          type="button"
        >
          {continueLabel}
        </button>
      </div>
    </section>
  );
}

export function PackRevealLoading({ label }: { label: string }) {
  const { overlayRef } = useRevealDialog(false);

  return (
    <section
      aria-label="Pack reveal"
      aria-modal="true"
      className="pack-reveal-overlay pack-reveal-loading"
      ref={overlayRef}
      role="dialog"
      tabIndex={-1}
    >
      <div className="pack-reveal-fallback" role="status">
        <span>{label}</span>
      </div>
    </section>
  );
}

export class PackRevealBoundary extends Component<
  PackRevealBoundaryProps,
  PackRevealBoundaryState
> {
  state: PackRevealBoundaryState = { failed: false };

  static getDerivedStateFromError(): PackRevealBoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <PackRevealFailure
          continueLabel={this.props.continueLabel}
          onComplete={this.props.onComplete}
        />
      );
    }

    return this.props.children;
  }
}
