// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fran } from "@/test/fixtures";

const { mockRequest } = vi.hoisted(() => ({ mockRequest: vi.fn() }));
vi.mock("@/services/wodApi", () => ({ requestParseWod: mockRequest }));

import { useParseWod } from "./useParseWod";

describe("useParseWod", () => {
  beforeEach(() => {
    mockRequest.mockReset();
  });

  it("stores the parsed WOD with an id on every movement", async () => {
    mockRequest.mockResolvedValue(fran);
    const { result } = renderHook(() => useParseWod());

    await act(() => result.current.parse("Fran"));

    expect(mockRequest).toHaveBeenCalledWith("Fran");
    expect(result.current.wod?.title).toBe("Fran");
    expect(result.current.wod?.movements.map((m) => m.name)).toEqual(["Thruster", "Pull-up"]);
    expect(result.current.wod?.movements.every((m) => typeof m.id === "string")).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("is loading while the request is in flight", async () => {
    let resolve: (wod: typeof fran) => void = () => {};
    mockRequest.mockReturnValue(new Promise((r) => (resolve = r)));
    const { result } = renderHook(() => useParseWod());

    act(() => {
      void result.current.parse("Fran");
    });
    expect(result.current.loading).toBe(true);

    await act(async () => resolve(fran));
    expect(result.current.loading).toBe(false);
  });

  it("stores the error message and clears the previous WOD", async () => {
    mockRequest.mockResolvedValueOnce(fran).mockRejectedValueOnce(new Error("Too long."));
    const { result } = renderHook(() => useParseWod());

    await act(() => result.current.parse("Fran"));
    await act(() => result.current.parse("x"));

    await waitFor(() => expect(result.current.error).toBe("Too long."));
    expect(result.current.wod).toBeNull();
  });
});
