// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useUndoShortcuts } from "./useUndoShortcuts";

function setup() {
  const undo = vi.fn();
  const redo = vi.fn();
  function Field() {
    const onKeyDown = useUndoShortcuts({ undo, redo });
    return <input aria-label="field" onKeyDown={onKeyDown} />;
  }
  render(<Field />);
  return { undo, redo, user: userEvent.setup(), field: screen.getByLabelText("field") };
}

describe("useUndoShortcuts", () => {
  afterEach(() => {
    cleanup();
  });

  it.each([
    ["Ctrl+Z", "{Control>}z{/Control}"],
    ["Cmd+Z", "{Meta>}z{/Meta}"],
  ])("undoes on %s", async (_label, keys) => {
    const { undo, redo, user, field } = setup();
    await user.click(field);
    await user.keyboard(keys);
    expect(undo).toHaveBeenCalledOnce();
    expect(redo).not.toHaveBeenCalled();
  });

  it.each([
    ["Ctrl+Shift+Z", "{Control>}{Shift>}z{/Shift}{/Control}"],
    ["Cmd+Shift+Z", "{Meta>}{Shift>}z{/Shift}{/Meta}"],
    ["Ctrl+Y", "{Control>}y{/Control}"],
  ])("redoes on %s", async (_label, keys) => {
    const { undo, redo, user, field } = setup();
    await user.click(field);
    await user.keyboard(keys);
    expect(redo).toHaveBeenCalledOnce();
    expect(undo).not.toHaveBeenCalled();
  });

  it("ignores keys without a modifier", async () => {
    const { undo, redo, user, field } = setup();
    await user.type(field, "zy");
    expect(field).toHaveValue("zy");
    expect(undo).not.toHaveBeenCalled();
    expect(redo).not.toHaveBeenCalled();
  });
});
