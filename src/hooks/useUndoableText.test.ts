// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { historyReducer, TYPING_GROUP_MS, useUndoableText } from "./useUndoableText";

const start = { entries: ["a"], index: 0, lastEditAt: null };

describe("historyReducer", () => {
  it("adds an undo step for the first edit", () => {
    const next = historyReducer(start, { type: "edit", value: "ab", at: 0 });
    expect(next).toEqual({ entries: ["a", "ab"], index: 1, lastEditAt: 0 });
  });

  it("groups quick consecutive edits into one step", () => {
    let state = historyReducer(start, { type: "edit", value: "ab", at: 0 });
    state = historyReducer(state, { type: "edit", value: "abc", at: TYPING_GROUP_MS - 1 });
    expect(state.entries).toEqual(["a", "abc"]);
  });

  it("starts a new step after a pause", () => {
    let state = historyReducer(start, { type: "edit", value: "ab", at: 0 });
    state = historyReducer(state, { type: "edit", value: "abc", at: TYPING_GROUP_MS });
    expect(state.entries).toEqual(["a", "ab", "abc"]);
  });

  it("ignores edits that don't change the value", () => {
    expect(historyReducer(start, { type: "edit", value: "a", at: 0 })).toBe(start);
    expect(historyReducer(start, { type: "replace", value: "a" })).toBe(start);
  });

  it("never groups a replace with typing", () => {
    let state = historyReducer(start, { type: "edit", value: "ab", at: 0 });
    state = historyReducer(state, { type: "replace", value: "a" });
    state = historyReducer(state, { type: "edit", value: "ax", at: 1 });
    expect(state.entries).toEqual(["a", "ab", "a", "ax"]);
  });

  it("undoes and redoes within bounds", () => {
    let state = historyReducer(start, { type: "edit", value: "ab", at: 0 });
    state = historyReducer(state, { type: "undo" });
    expect(state.index).toBe(0);
    expect(historyReducer(state, { type: "undo" })).toBe(state);

    state = historyReducer(state, { type: "redo" });
    expect(state.index).toBe(1);
    expect(historyReducer(state, { type: "redo" })).toBe(state);
  });

  it("drops the redo steps when editing after an undo", () => {
    let state = historyReducer(start, { type: "edit", value: "ab", at: 0 });
    state = historyReducer(state, { type: "undo" });
    state = historyReducer(state, { type: "edit", value: "az", at: 1 });
    expect(state.entries).toEqual(["a", "az"]);
    expect(state.index).toBe(1);
  });
});

describe("useUndoableText", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("exposes the value and undo/redo availability", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useUndoableText("hello"));
    expect(result.current).toMatchObject({ value: "hello", canUndo: false, canRedo: false });

    act(() => result.current.edit("hello world"));
    expect(result.current).toMatchObject({ value: "hello world", canUndo: true, canRedo: false });

    act(() => result.current.undo());
    expect(result.current).toMatchObject({ value: "hello", canUndo: false, canRedo: true });

    act(() => result.current.redo());
    expect(result.current.value).toBe("hello world");

    act(() => result.current.replace("hello"));
    expect(result.current.value).toBe("hello");
    act(() => result.current.undo());
    expect(result.current.value).toBe("hello world");
  });
});
