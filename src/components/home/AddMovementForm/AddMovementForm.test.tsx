// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddMovementForm } from "./AddMovementForm";

async function openForm() {
  const onAdd = vi.fn();
  const user = userEvent.setup();
  render(<AddMovementForm onAdd={onAdd} />);
  await user.click(screen.getByRole("button", { name: "Add movement" }));
  return { onAdd, user };
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
});
