// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fran, strengthAndMetcon } from "@/test/fixtures";
import type { WodState } from "@/types/wod";
import { toWodState } from "@/utils/toWodState";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));
vi.mock("@/services/videosApi", () => ({ requestMovementVideos: mockRequest }));

import { useMovementVideos, videoSearchKey } from "./useMovementVideos";
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

  it("also finds videos about a named workout, stored on its part", async () => {
    mockRequest.mockImplementation(async (name: string, kind: string) => [
      video(`${kind} ${name}`),
    ]);
    const { result } = renderWithWod(toWodState(strengthAndMetcon));

    await waitFor(() => expect(result.current.videos.loading).toBe(false));
    expect(mockRequest).toHaveBeenCalledWith("Fran", "workout");
    expect(mockRequest).toHaveBeenCalledWith("Thruster", "movement");
    const [squats, fran, coolDown] = result.current.wod!.parts;
    expect(fran.videos).toEqual([video("workout Fran")]);
    expect(squats.videos).toBeUndefined();
    expect(coolDown.videos).toBeUndefined();
  });

  it("looks up a movement once, even when it's in several parts", async () => {
    const wod = toWodState(strengthAndMetcon);
    wod.parts[0].movements.push({ ...wod.parts[1].movements[1], id: "extra", name: "Pull-ups" });
    mockRequest.mockImplementation(async (name: string) => [video(name)]);
    const { result } = renderWithWod(wod);

    await waitFor(() => expect(result.current.videos.loading).toBe(false));
    expect(mockRequest.mock.calls).toEqual([
      ["Back Squat", "movement"],
      ["Pull-ups", "movement"],
      ["Fran", "workout"],
      ["Thruster", "movement"],
      ["Row", "movement"],
    ]);
    expect(result.current.wod!.parts[1].movements[1].videos).toEqual([video("Pull-ups")]);
  });

  it("doesn't look up movements that already have videos", async () => {
    const wod = toWodState(strengthAndMetcon);
    wod.parts = wod.parts.map((part) => ({
      ...part,
      videos: [],
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
    expect(mockRequest).toHaveBeenCalledTimes(5);
  });

  it("keeps every result when requests finish in any order", async () => {
    const resolvers = new Map<string, () => void>();
    mockRequest.mockImplementation(
      (name: string) => new Promise((resolve) => resolvers.set(name, () => resolve([video(name)]))),
    );
    const { result } = renderWithWod(toWodState(strengthAndMetcon));
    await waitFor(() => expect(resolvers.size).toBe(5));

    for (const name of ["Row", "Thruster", "Fran", "Back Squat", "Pull-up"]) {
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
    expect(result.current.videos).toEqual({ loading: false, pending: new Set(), error: null });
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("lists the searches still waiting, until each one is found", async () => {
    const waiting = new Map<string, (videos: unknown[]) => void>();
    mockRequest.mockImplementation(
      (name: string) => new Promise((resolve) => waiting.set(name, resolve)),
    );
    const finish = (name: string) => waiting.get(name)!([video(name)]);
    const { result } = renderWithWod(toWodState(fran));

    expect(result.current.videos.pending).toEqual(
      new Set([
        videoSearchKey("Fran", "workout"),
        videoSearchKey("Thruster", "movement"),
        videoSearchKey("Pull-up", "movement"),
      ]),
    );
    await waitFor(() => expect(waiting.size).toBe(3));
    act(() => finish("Thruster"));
    await waitFor(() =>
      expect(result.current.videos.pending.has(videoSearchKey("Thruster", "movement"))).toBe(false),
    );
    expect(result.current.videos.pending.size).toBe(2);
  });
});
