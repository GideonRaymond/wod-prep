import { useCallback, useReducer } from "react";

// Edits made within this window are grouped into one undo step, like native text inputs.
export const TYPING_GROUP_MS = 1000;

type History = {
  entries: string[];
  index: number;
  lastEditAt: number | null;
};

type Action =
  | { type: "edit"; value: string; at: number }
  | { type: "replace"; value: string }
  | { type: "undo" }
  | { type: "redo" };

export function historyReducer(state: History, action: Action): History {
  const current = state.entries[state.index];

  switch (action.type) {
    case "edit": {
      if (action.value === current) return state;
      const atTip = state.index === state.entries.length - 1;
      const grouped =
        atTip &&
        state.index > 0 &&
        state.lastEditAt !== null &&
        action.at - state.lastEditAt < TYPING_GROUP_MS;
      if (grouped) {
        const entries = [...state.entries];
        entries[state.index] = action.value;
        return { ...state, entries, lastEditAt: action.at };
      }
      return {
        entries: [...state.entries.slice(0, state.index + 1), action.value],
        index: state.index + 1,
        lastEditAt: action.at,
      };
    }
    case "replace":
      // A deliberate jump (e.g. revert) is always its own undo step.
      if (action.value === current) return state;
      return {
        entries: [...state.entries.slice(0, state.index + 1), action.value],
        index: state.index + 1,
        lastEditAt: null,
      };
    case "undo":
      return state.index > 0 ? { ...state, index: state.index - 1, lastEditAt: null } : state;
    case "redo":
      return state.index < state.entries.length - 1
        ? { ...state, index: state.index + 1, lastEditAt: null }
        : state;
  }
}

export function useUndoableText(initial: string) {
  const [state, dispatch] = useReducer(historyReducer, {
    entries: [initial],
    index: 0,
    lastEditAt: null,
  });

  return {
    value: state.entries[state.index],
    canUndo: state.index > 0,
    canRedo: state.index < state.entries.length - 1,
    edit: useCallback((value: string) => dispatch({ type: "edit", value, at: Date.now() }), []),
    replace: useCallback((value: string) => dispatch({ type: "replace", value }), []),
    undo: useCallback(() => dispatch({ type: "undo" }), []),
    redo: useCallback(() => dispatch({ type: "redo" }), []),
  };
}
