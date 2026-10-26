import { ViewTransition, type ReactNode } from "react";
import { BoardLayout } from "@/components/shared/BoardLayout";
import { Logo } from "@/components/shared/Logo";
import { Stepper } from "@/components/shared/Stepper";
import { WOD_STEPS } from "@/constants/flow";

export type FlowPageProps = {
  /** Which step this page is (see STEP). */
  step: number;
  /** The last step that can be opened from here. */
  reachable?: number;
  /** The chalkboard, and anything under it; without one, the page is a single column. */
  board?: ReactNode;
  /** Keep the board stuck to the top on phones too (when it folds into a bar there). */
  stickyBoardOnPhones?: boolean;
  children: ReactNode;
};

/**
 * The frame every step of the flow shares: the logo and the stepper on top, then the chalkboard on
 * the left and the step's own content beside it. The board starts in the same place on every
 * step, so it stays put while the page around it changes. Moving between steps, the page beside
 * the board fades out with a small lift and the next one fades in from the side it's headed
 * (see stepTransition and the nav-forward and nav-back styles in globals.css).
 */
export function FlowPage({
  step,
  reachable,
  board,
  stickyBoardOnPhones = false,
  children,
}: FlowPageProps) {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <header className="flex flex-col items-center gap-4 md:grid md:grid-cols-[1fr_auto_1fr]">
        <Logo className="md:justify-self-start" />
        <Stepper steps={WOD_STEPS} current={step} reachable={reachable} />
      </header>
      {board ? (
        <BoardLayout className="mt-8" board={board} stickyOnPhones={stickyBoardOnPhones}>
          <StepContent>{children}</StepContent>
        </BoardLayout>
      ) : (
        <div className="mx-auto mt-8 max-w-2xl">
          <StepContent>{children}</StepContent>
        </div>
      )}
    </main>
  );
}

const BY_DIRECTION = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" };

/** A step's own content, which enters and leaves in the direction of the step it's moving to. */
function StepContent({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={BY_DIRECTION} exit={BY_DIRECTION} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
