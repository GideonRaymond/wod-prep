// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddMovementForm } from "./AddMovementForm";
import type { MovementItem } from "@/types/wod";

const run: MovementItem = {
  id: "run-1",
  name: "Run",
  originalText: "1 mile Run",
  reps: "1 mile",
  load: null,
  category: "monostructural",
};

async function openForm(movements: MovementItem[] = []) {
  const onAdd = vi.fn();
  const onMerge = vi.fn();
  const user = userEvent.setup();
  render(<AddMovementForm movements={movements} onAdd={onAdd} onMerge={onMerge} />);
  await user.click(screen.getByRole("button", { name: "Add movement" }));
  return { onAdd, onMerge, user };
}

describe("AddMovementForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("adds a movement", async () => {
    const { onAdd, user } = await openForm();
    const add = screen.getByRole("button", { name: "Add" });
    expect(add).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/Movement/), "  Wall Balls ");
    await user.type(screen.getByPlaceholderText(/Reps/), "15");
    await user.type(screen.getByPlaceholderText(/Load/), "20/14 lb");
    await user.selectOptions(screen.getByRole("combobox", { name: "Category" }), "weightlifting");
    await user.click(add);

    expect(onAdd).toHaveBeenCalledWith({
      name: "Wall Balls",
      originalText: "Wall Balls",
      reps: "15",
      load: "20/14 lb",
      category: "weightlifting",
    });
    expect(screen.getByRole("button", { name: "Add movement" })).toBeInTheDocument();
  });

  it("leaves out empty reps and load", async () => {
    const { onAdd, user } = await openForm();
    await user.type(screen.getByPlaceholderText(/Movement/), "Run");
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ reps: null, load: null, category: "other" }),
    );
  });

  it("ignores a whitespace-only name", async () => {
    const { user } = await openForm();
    await user.type(screen.getByPlaceholderText(/Movement/), "   ");
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });

  it("cancels and clears the form", async () => {
    const { onAdd, user } = await openForm();
    await user.type(screen.getByPlaceholderText(/Movement/), "Wall Balls");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onAdd).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Add movement" }));
    expect(screen.getByPlaceholderText(/Movement/)).toHaveValue("");
  });

  describe("when the movement is already in the workout", () => {
    async function addRun(movements = [run]) {
      const form = await openForm(movements);
      await form.user.type(screen.getByPlaceholderText(/Movement/), "run");
      await form.user.type(screen.getByPlaceholderText(/Reps/), "1 mile");
      await form.user.click(screen.getByRole("button", { name: "Add" }));
      return form;
    }

    it("asks to merge and shows the merged result", async () => {
      const { onAdd } = await addRun();

      const dialog = screen.getByRole("dialog", { name: "Run is already in this workout" });
      const preview = within(dialog).getByRole("group", { name: "Merged movement" });
      expect(within(preview).getByRole("heading", { name: "Run" })).toBeInTheDocument();
      expect(within(preview).getByTitle("Reps")).toHaveTextContent("2 miles");
      expect(within(dialog).getByRole("button", { name: "Merge" })).toHaveFocus();
      expect(onAdd).not.toHaveBeenCalled();
    });

    it("merges into the existing movement", async () => {
      const { user, onAdd, onMerge } = await addRun();
      await user.click(screen.getByRole("button", { name: "Merge" }));

      expect(onMerge).toHaveBeenCalledWith("run-1", {
        ...run,
        reps: "2 miles",
        originalText: "1 mile Run · run",
      });
      expect(onAdd).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Add movement" })).toBeInTheDocument();
    });

    it.each([
      [
        "the Cancel button",
        async (user: ReturnType<typeof userEvent.setup>) =>
          user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" })),
      ],
      ["Escape", async (user: ReturnType<typeof userEvent.setup>) => user.keyboard("{Escape}")],
    ])("keeps the form filled in when cancelled with %s", async (_label, cancel) => {
      const { user, onAdd, onMerge } = await addRun();
      const dialog = screen.getByRole("dialog");
      await cancel(user);

      expect(dialog).not.toBeInTheDocument();
      expect(onAdd).not.toHaveBeenCalled();
      expect(onMerge).not.toHaveBeenCalled();
      expect(screen.getByPlaceholderText(/Movement/)).toHaveValue("run");
      expect(screen.getByPlaceholderText(/Reps/)).toHaveValue("1 mile");
    });

    it("adds the same movement at a different load without asking", async () => {
      const deadlift = { ...run, id: "dl", name: "Deadlift", load: "225 lb", reps: "5" };
      const { user, onAdd } = await openForm([deadlift]);
      await user.type(screen.getByPlaceholderText(/Movement/), "Deadlift");
      await user.type(screen.getByPlaceholderText(/Load/), "315 lb");
      await user.click(screen.getByRole("button", { name: "Add" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ load: "315 lb" }));
    });
  });
});
