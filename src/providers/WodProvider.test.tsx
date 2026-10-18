// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useWod, WodProvider } from "./WodProvider";
import { WOD_STORAGE_KEY } from "@/stores/wodStore";
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

  it("saves updates to sessionStorage and restores them in a new provider", () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <WodProvider>{children}</WodProvider>
    );
    const wod = toWodState(fran);
    const first = renderHook(() => useWod(), { wrapper });
    act(() => first.result.current.setWod(wod));
    expect(JSON.parse(sessionStorage.getItem(WOD_STORAGE_KEY)!)).toEqual(wod);
    first.unmount();

    const second = renderHook(() => useWod(), { wrapper });
    expect(second.result.current.wod).toEqual(wod);
    expect(second.result.current.restored).toBe(true);
  });

  it("explains a missing provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useWod())).toThrow(/inside <WodProvider>/);
    vi.restoreAllMocks();
  });
});
