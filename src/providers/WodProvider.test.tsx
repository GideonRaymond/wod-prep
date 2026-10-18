// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useWod, WodProvider } from "./WodProvider";
import { fran } from "@/test/fixtures";
import { toWodState } from "@/utils/toWodState";

describe("WodProvider", () => {
  it("starts empty and shares updates", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <WodProvider>{children}</WodProvider>
    );
    const { result } = renderHook(() => useWod(), { wrapper });
    expect(result.current.wod).toBeNull();

    const wod = toWodState(fran);
    act(() => result.current.setWod(wod));
    expect(result.current.wod).toBe(wod);
  });

  it("can start with a WOD", () => {
    const wod = toWodState(fran);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <WodProvider initialWod={wod}>{children}</WodProvider>
    );
    expect(renderHook(() => useWod(), { wrapper }).result.current.wod).toBe(wod);
  });

  it("explains a missing provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useWod())).toThrow(/inside <WodProvider>/);
    vi.restoreAllMocks();
  });
});
