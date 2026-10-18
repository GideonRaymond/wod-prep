// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));
vi.mock("@/services/pointsOfPerformanceApi", () => ({ requestPointsOfPerformance: mockRequest }));

import { usePointsOfPerformance } from "./usePointsOfPerformance";

const points = { cues: ["a", "b", "c"], faults: [] };

describe("usePointsOfPerformance", () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it("does nothing until load is called", () => {
    const { result } = renderHook(() => usePointsOfPerformance("Thruster"));
    expect(result.current.status).toBe("idle");
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("loads the points once", async () => {
    mockRequest.mockResolvedValue({ points, source: "curated" });
    const { result } = renderHook(() => usePointsOfPerformance("Thruster"));

    await act(() => result.current.load());
    expect(result.current).toMatchObject({ status: "success", points, source: "curated" });

    await act(() => result.current.load());
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockRequest).toHaveBeenCalledWith("Thruster");
  });

  it("is loading while the request is in flight", () => {
    mockRequest.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePointsOfPerformance("Thruster"));
    act(() => {
      void result.current.load();
    });
    expect(result.current.status).toBe("loading");
  });

  it("stores the error and retries on the next load", async () => {
    mockRequest
      .mockRejectedValueOnce(new Error("Rate limited."))
      .mockResolvedValueOnce({ points, source: "ai" });
    const { result } = renderHook(() => usePointsOfPerformance("Ring Muscle-up"));

    await act(() => result.current.load());
    expect(result.current).toMatchObject({ status: "error", error: "Rate limited." });

    await act(() => result.current.load());
    expect(result.current).toMatchObject({ status: "success", source: "ai" });
  });
});
