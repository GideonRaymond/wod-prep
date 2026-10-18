// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fran, strengthAndMetcon } from "@/test/fixtures";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));
vi.mock("@/services/wodApi", () => ({ requestParseWod: mockRequest }));

import { useParseWod } from "./useParseWod";
import { WodProvider } from "@/providers/WodProvider";

describe("useParseWod", () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it("stores the parsed WOD with an id on every part and movement", async () => {
    mockRequest.mockResolvedValue(strengthAndMetcon);
    const { result } = renderHook(() => useParseWod(), { wrapper: WodProvider });

    await act(() => result.current.parse("A) squats B) Fran"));

    expect(mockRequest).toHaveBeenCalledWith("A) squats B) Fran");
    const parts = result.current.wod!.parts;
    expect(parts.map((p) => p.label)).toEqual(["A", "B", "Cool-down"]);
    expect(parts[1].movements.map((m) => m.name)).toEqual(["Thruster", "Pull-up"]);
    const ids = [...parts.map((p) => p.id), ...parts.flatMap((p) => p.movements.map((m) => m.id))];
    expect(ids.every((id) => typeof id === "string")).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect(result.current.error).toBeNull();
  });

  it("is loading while the request is in flight", async () => {
    let resolve: (wod: typeof fran) => void = () => {};
    mockRequest.mockReturnValue(new Promise((r) => (resolve = r)));
    const { result } = renderHook(() => useParseWod(), { wrapper: WodProvider });

    act(() => {
      void result.current.parse("Fran");
    });
    expect(result.current.loading).toBe(true);

    await act(async () => resolve(fran));
    expect(result.current.loading).toBe(false);
  });

  it("stores the error message and clears the previous WOD", async () => {
    mockRequest.mockResolvedValueOnce(fran).mockRejectedValueOnce(new Error("Too long."));
    const { result } = renderHook(() => useParseWod(), { wrapper: WodProvider });

    await act(() => result.current.parse("Fran"));
    await act(() => result.current.parse("x"));

    await waitFor(() => expect(result.current.error).toBe("Too long."));
    expect(result.current.wod).toBeNull();
  });

  it("remembers the text of the last successful parse", async () => {
    mockRequest.mockResolvedValueOnce(fran).mockRejectedValueOnce(new Error("Too long."));
    const { result } = renderHook(() => useParseWod(), { wrapper: WodProvider });
    expect(result.current.parsedText).toBeNull();

    await act(() => result.current.parse("Fran"));
    expect(result.current.parsedText).toBe("Fran");

    await act(() => result.current.parse("x"));
    expect(result.current.parsedText).toBeNull();
  });
});
