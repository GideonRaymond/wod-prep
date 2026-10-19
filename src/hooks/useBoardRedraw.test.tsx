// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { strengthAndMetcon } from "@/test/fixtures";
import type { WodState } from "@/types/wod";
import { partKey } from "@/utils/partKey";
import { toWodState } from "@/utils/toWodState";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));
vi.mock("@/services/boardApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/services/boardApi")>()),
  requestBoards: mockRequest,
}));

import { useBoardRedraw } from "./useBoardRedraw";
import { useWod, WodProvider } from "@/providers/WodProvider";

function renderWithWod(wod: WodState | null) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <WodProvider initialWod={wod}>{children}</WodProvider>
  );
  return renderHook(() => ({ board: useBoardRedraw(), ...useWod() }), { wrapper });
}

const wod = toWodState(strengthAndMetcon);
/** The workout with Fran (part B) made lighter. */
const lighterFran: WodState = {
  parts: wod.parts.map((part, i) => (i === 1 ? { ...part, rounds: "15-12-9" } : part)),
};
const redrawn = ["B. Fran", "15-12-9 for time"];

describe("useBoardRedraw", () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it("does nothing for a workout that hasn't been edited", () => {
    const { result } = renderWithWod(wod);
    expect(result.current.board).toEqual({ loading: false, error: null });
    expect(mockRequest).not.toHaveBeenCalled();
  });

  it("redraws only the edited parts and stores their new board", async () => {
    mockRequest.mockResolvedValue([redrawn]);
    const { result } = renderWithWod(lighterFran);
    expect(result.current.board.loading).toBe(true);

    await waitFor(() => expect(result.current.board.loading).toBe(false));
    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockRequest.mock.calls[0][0].map((p: { id: string }) => p.id)).toEqual([
      wod.parts[1].id,
    ]);
    const [squats, fran] = result.current.wod!.parts;
    expect(fran.board).toEqual(redrawn);
    expect(fran.boardKey).toBe(partKey(fran));
    expect(squats.board).toEqual(wod.parts[0].board);
  });

  it("doesn't store a board for a part edited again while it was drawn", async () => {
    let resolve: (boards: string[][]) => void = () => {};
    mockRequest.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    mockRequest.mockResolvedValue([["B. Fran", "9-6-3"]]);
    const { result } = renderWithWod(lighterFran);

    act(() =>
      result.current.setWod((current) => ({
        parts: current!.parts.map((part, i) => (i === 1 ? { ...part, rounds: "9-6-3" } : part)),
      })),
    );
    await act(async () => resolve([redrawn]));
    await waitFor(() => expect(result.current.board.loading).toBe(false));
    expect(result.current.wod!.parts[1].board).toEqual(["B. Fran", "9-6-3"]);
  });

  it("reports a failure, stops loading and keeps the old board", async () => {
    mockRequest.mockRejectedValue(new Error("Rate limited."));
    const { result } = renderWithWod(lighterFran);
    await waitFor(() => expect(result.current.board.error).toBe("Rate limited."));
    expect(result.current.board.loading).toBe(false);
    expect(result.current.wod!.parts[1].board).toEqual(wod.parts[1].board);
  });
});
