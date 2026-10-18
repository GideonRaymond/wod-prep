// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { TextInput } from "./TextInput";

describe("TextInput", () => {
  afterEach(() => {
    cleanup();
  });

  it("passes through input props", async () => {
    render(<TextInput placeholder="Reps" />);
    await userEvent.type(screen.getByPlaceholderText("Reps"), "15");
    expect(screen.getByPlaceholderText("Reps")).toHaveValue("15");
  });

  it("is not marked invalid by default", () => {
    render(<TextInput aria-label="Reps" />);
    expect(screen.getByLabelText("Reps")).not.toHaveAttribute("aria-invalid");
  });

  it("shows the invalid state", () => {
    render(<TextInput aria-label="Reps" invalid />);
    const input = screen.getByLabelText("Reps");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveClass("border-red-500");
  });
});
