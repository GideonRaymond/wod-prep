// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { strengthAndMetcon } from "@/test/fixtures";
import type { WodState, WorkoutPartState } from "@/types/wod";
import { toWodState } from "@/utils/toWodState";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));
vi.mock("@/services/articlesApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/articlesApi")>()),
  requestArticles: mockRequest,
}));

import { useArticles } from "./useArticles";
import { articlesKey } from "@/services/articlesApi";
import { useWod, WodProvider } from "@/providers/WodProvider";

const article = (title: string) => ({ title, url: `https://example.com/${title}` });

function renderWithWod(wod: WodState | null) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <WodProvider initialWod={wod}>{children}</WodProvider>
  );
  return renderHook(() => ({ articles: useArticles(), ...useWod() }), { wrapper });
}

describe("useArticles", () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it("finds articles for each part and stores them on it", async () => {
    mockRequest.mockImplementation(async (part: WorkoutPartState) => [article(part.title)]);
    const { result } = renderWithWod(toWodState(strengthAndMetcon));
    expect(result.current.articles.loading).toBe(true);

    await waitFor(() => expect(result.current.articles.loading).toBe(false));
    expect(result.current.wod!.parts.map((p) => p.articles)).toEqual(
      strengthAndMetcon.parts.map((p) => [article(p.title)]),
    );
    expect(mockRequest).toHaveBeenCalledTimes(strengthAndMetcon.parts.length);
  });

  it("skips parts that already have articles, even an empty list, or have no movements", async () => {
    const wod = toWodState(strengthAndMetcon);
    wod.parts[0] = { ...wod.parts[0], articles: [] };
    wod.parts[2] = { ...wod.parts[2], movements: [] };
    mockRequest.mockResolvedValue([]);
    const { result } = renderWithWod(wod);

    await waitFor(() => expect(result.current.articles.loading).toBe(false));
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockRequest.mock.calls[0][0].id).toBe(wod.parts[1].id);
  });

  it("reports the first failure and stops loading", async () => {
    mockRequest.mockRejectedValue(new Error("Rate limited."));
    const { result } = renderWithWod(toWodState(strengthAndMetcon));

    await waitFor(() => expect(result.current.articles.error).toBe("Rate limited."));
    expect(result.current.articles.loading).toBe(false);
    expect(mockRequest).toHaveBeenCalledTimes(strengthAndMetcon.parts.length);
  });

  it("does nothing without a workout", () => {
    const { result } = renderWithWod(null);
    expect(result.current.articles).toEqual({ loading: false, error: null });
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("searches again once a part's stimulus or intensity is edited", async () => {
    mockRequest.mockImplementation(async (part: WorkoutPartState) => [
      article(`${part.title} ${part.stimulus.intensity}`),
    ]);
    const { result } = renderWithWod(toWodState(strengthAndMetcon));
    await waitFor(() => expect(result.current.articles.loading).toBe(false));
    const [, fran] = result.current.wod!.parts;
    expect(fran.articlesKey).toBe(articlesKey(fran));

    act(() =>
      result.current.setWod((current) => ({
        parts: current!.parts.map((p) =>
          p.id === fran.id ? { ...p, stimulus: { ...p.stimulus, intensity: 4 } } : p,
        ),
      })),
    );
    expect(result.current.articles.loading).toBe(true);
    await waitFor(() => expect(result.current.articles.loading).toBe(false));
    expect(result.current.wod!.parts[1].articles).toEqual([article("Fran 4")]);
    expect(mockRequest).toHaveBeenCalledTimes(strengthAndMetcon.parts.length + 1);
  });

  it("keeps the articles of a part saved before what they were found for was kept", async () => {
    const wod = toWodState(strengthAndMetcon);
    wod.parts = wod.parts.map((p) => ({ ...p, articles: [article("old")] }));
    renderWithWod(wod);
    await new Promise((resolve) => setTimeout(resolve));
    expect(mockRequest).not.toHaveBeenCalled();
  });
});
