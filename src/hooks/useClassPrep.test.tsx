// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { classPrep, strengthAndMetcon } from "@/test/fixtures";
import type { WodState } from "@/types/wod";
import { toWodState } from "@/utils/toWodState";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));
vi.mock("@/services/classPrepApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/classPrepApi")>()),
  requestClassPrep: mockRequest,
}));

import { useClassPrep } from "./useClassPrep";
import { useWod, WodProvider } from "@/providers/WodProvider";
import { prepKey } from "@/services/classPrepApi";

function renderWithWod(wod: WodState | null) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <WodProvider initialWod={wod}>{children}</WodProvider>
  );
  return renderHook(() => ({ prep: useClassPrep(), ...useWod() }), { wrapper });
}

describe("useClassPrep", () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it("plans the class once and stores the plan on the workout", async () => {
    mockRequest.mockResolvedValue(classPrep);
    const wod = toWodState(strengthAndMetcon);
    const { result } = renderWithWod(wod);
    expect(result.current.prep).toMatchObject({ loading: true, plan: null });

    await waitFor(() => expect(result.current.prep.loading).toBe(false));
    expect(result.current.prep.plan).toEqual(classPrep);
    expect(result.current.wod!.prep).toEqual({ key: prepKey(wod), plan: classPrep });
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it("uses a stored plan for the same workout without asking again", () => {
    const wod = toWodState(strengthAndMetcon);
    const { result } = renderWithWod({ ...wod, prep: { key: prepKey(wod), plan: classPrep } });
    expect(result.current.prep).toEqual({ loading: false, error: null, plan: classPrep });
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("plans again once the workout is edited", async () => {
    mockRequest.mockResolvedValue(classPrep);
    const wod = toWodState(strengthAndMetcon);
    const { result } = renderWithWod({ ...wod, prep: { key: prepKey(wod), plan: classPrep } });

    act(() =>
      result.current.setWod((current) => ({
        ...current!,
        parts: current!.parts.slice(0, 2),
      })),
    );
    expect(result.current.prep).toMatchObject({ loading: true, plan: null });
    await waitFor(() => expect(result.current.prep.loading).toBe(false));
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(result.current.wod!.prep!.key).toBe(prepKey(result.current.wod!));
  });

  it("reports a failure and stops loading", async () => {
    mockRequest.mockRejectedValue(new Error("Rate limited."));
    const { result } = renderWithWod(toWodState(strengthAndMetcon));
    await waitFor(() => expect(result.current.prep.error).toBe("Rate limited."));
    expect(result.current.prep.loading).toBe(false);
  });

  it("does nothing without a workout", () => {
    const { result } = renderWithWod(null);
    expect(result.current.prep).toEqual({ loading: false, error: null, plan: null });
  });
});
