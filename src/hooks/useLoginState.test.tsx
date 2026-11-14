// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createLoginStore } from "@/stores/loginStore";
import { useLoginState } from "./useLoginState";

describe("useLoginState", () => {
  it("follows the store", () => {
    const store = createLoginStore();
    const { result } = renderHook(() => useLoginState(store));
    expect(result.current.open).toBe(false);
    act(() => void store.request("Log in."));
    expect(result.current).toMatchObject({ open: true, reason: "Log in." });
    act(() => store.finish("example"));
    expect(result.current).toEqual({ open: false, reason: null, exampleWanted: true });
  });
});
