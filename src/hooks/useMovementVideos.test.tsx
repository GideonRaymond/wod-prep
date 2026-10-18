// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { strengthAndMetcon } from "@/test/fixtures";
import type { WodState } from "@/types/wod";
import { toWodState } from "@/utils/toWodState";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));
vi.mock("@/services/videosApi", () => ({ requestMovementVideos: mockRequest }));

import { useMovementVideos } from "./useMovementVideos";
import { useWod, WodProvider } from "@/providers/WodProvider";

const video = (title: string) => ({ title, url: `https://www.youtube.com/watch?v=${title}` });

function renderWithWod(wod: WodState | null) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <WodProvider initialWod={wod}>{children}</WodProvider>
  );
  return renderHook(() => ({ videos: useMovementVideos(), ...useWod() }), { wrapper });
}

const videoTitles = (wod: WodState | null) =>
  wod!.parts.map((p) => p.movements.map((m) => m.videos?.map((v) => v.title)));

describe("useMovementVideos", () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it("finds videos for each movement and stores them on the workout", async () => {
    mockRequest.mockImplementation(async (name: string) => [video(name)]);
    const { result } = renderWithWod(toWodState(strengthAndMetcon));
    expect(result.current.videos.loading).toBe(true);

    await waitFor(() => expect(result.current.videos.loading).toBe(false));
    expect(videoTitles(result.current.wod)).toEqual([
      [["Back Squat"]],
      [["Thruster"], ["Pull-up"]],
      [["Row"]],
    ]);
    expect(result.current.videos.error).toBeNull();
  });

  it("looks up a movement once, even when it's in several parts", async () => {
    const wod = toWodState(strengthAndMetcon);
    wod.parts[0].movements.push({ ...wod.parts[1].movements[1], id: "extra", name: "Pull-ups" });
    mockRequest.mockImplementation(async (name: string) => [video(name)]);
    const { result } = renderWithWod(wod);

    await waitFor(() => expect(result.current.videos.loading).toBe(false));
    expect(mockRequest.mock.calls.map(([name]) => name)).toEqual([
      "Back Squat",
      "Pull-ups",
      "Thruster",
      "Row",
    ]);
    expect(result.current.wod!.parts[1].movements[1].videos).toEqual([video("Pull-ups")]);
  });

  it("doesn't look up movements that already have videos", async () => {
    const wod = toWodState(strengthAndMetcon);
    wod.parts = wod.parts.map((part) => ({
      ...part,
      movements: part.movements.map((m) => ({ ...m, videos: [] })),
    }));
    const { result } = renderWithWod(wod);

    expect(result.current.videos.loading).toBe(false);
    await act(async () => {});
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("stores an empty list when nothing is found, so it isn't searched again", async () => {
    mockRequest.mockResolvedValue([]);
    const { result } = renderWithWod(toWodState(strengthAndMetcon));

    await waitFor(() => expect(result.current.videos.loading).toBe(false));
    expect(result.current.wod!.parts[0].movements[0].videos).toEqual([]);
    expect(mockRequest).toHaveBeenCalledTimes(4);
  });

  it("keeps every result when requests finish in any order", async () => {
    const resolvers = new Map<string, () => void>();
    mockRequest.mockImplementation(
      (name: string) => new Promise((resolve) => resolvers.set(name, () => resolve([video(name)]))),
    );
    const { result } = renderWithWod(toWodState(strengthAndMetcon));
    await waitFor(() => expect(resolvers.size).toBe(4));

    for (const name of ["Row", "Thruster", "Back Squat", "Pull-up"]) {
      await act(async () => resolvers.get(name)!());
    }
    expect(videoTitles(result.current.wod)).toEqual([
      [["Back Squat"]],
      [["Thruster"], ["Pull-up"]],
      [["Row"]],
    ]);
  });

  it("reports the first error and stops loading the movements that failed", async () => {
    mockRequest.mockImplementation(async (name: string) => {
      if (name === "Row") return [video(name)];
      throw new Error("Videos need a YouTube API key.");
    });
    const { result } = renderWithWod(toWodState(strengthAndMetcon));

    await waitFor(() => expect(result.current.videos.loading).toBe(false));
    expect(result.current.videos.error).toBe("Videos need a YouTube API key.");
    expect(result.current.wod!.parts[2].movements[0].videos).toEqual([video("Row")]);
    expect(result.current.wod!.parts[0].movements[0].videos).toBeUndefined();
  });

  it("does nothing without a workout", () => {
    const { result } = renderWithWod(null);
    expect(result.current.videos).toEqual({ loading: false, error: null });
    expect(mockRequest).not.toHaveBeenCalled();
  });
});
