// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BOARD_PLACEHOLDER, WodInputForm } from "./WodInputForm";
import { EXAMPLE_WOD, MAX_WOD_LENGTH } from "@/constants/wod";

const textbox = () => screen.getByRole("textbox", { name: "Workout" });
const submitButton = () => screen.getByRole("button", { name: "Break it down" });

function setup(loading = false, parsedText: string | null = null) {
  const onSubmit = vi.fn();
  render(<WodInputForm loading={loading} parsedText={parsedText} onSubmit={onSubmit} />);
  return { onSubmit, user: userEvent.setup() };
}

describe("WodInputForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("disables submit until a workout is entered", async () => {
    const { user } = setup();
    expect(submitButton()).toBeDisabled();
    await user.type(textbox(), "Fran");
    expect(submitButton()).toBeEnabled();
  });

  it("submits the entered text", async () => {
    const { user, onSubmit } = setup();
    await user.type(textbox(), "Fran");
    await user.click(submitButton());
    expect(onSubmit).toHaveBeenCalledWith("Fran");
  });

  it("fills in the example and hides the example button", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "Use example" }));

    expect((textbox() as HTMLTextAreaElement).value).toContain("Thrusters");
    expect(screen.queryByRole("button", { name: "Use example" })).not.toBeInTheDocument();
  });

  it("shows a loading state", () => {
    setup(true);
    expect(screen.getByRole("button", { name: "Parsing…" })).toBeDisabled();
  });

  it("shows a character count", async () => {
    const { user } = setup();
    expect(screen.getByText(`0 / ${MAX_WOD_LENGTH}`)).toBeInTheDocument();
    await user.type(textbox(), "Fran");
    expect(screen.getByText(`4 / ${MAX_WOD_LENGTH}`)).toBeInTheDocument();
  });

  it("limits the text box to the max length", () => {
    setup();
    expect(textbox()).toHaveAttribute("maxLength", String(MAX_WOD_LENGTH));
  });

  it("warns when the max length is reached", () => {
    setup();
    fireEvent.change(textbox(), { target: { value: "x".repeat(MAX_WOD_LENGTH) } });
    expect(screen.getByText(/Maximum length reached/)).toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
  });

  it("disables submit when the text is over the max length", () => {
    setup();
    fireEvent.change(textbox(), { target: { value: "x".repeat(MAX_WOD_LENGTH + 1) } });
    expect(submitButton()).toBeDisabled();
  });

  describe("after a parse", () => {
    it("starts with the parsed text", () => {
      setup(false, "Fran");
      expect(textbox()).toHaveValue("Fran");
    });

    it("disables submit until the text changes, with a hint", async () => {
      const { user } = setup(false, "Fran");
      expect(submitButton()).toBeDisabled();
      expect(submitButton()).toHaveAccessibleDescription(
        "Edit the workout to break it down again.",
      );

      await user.type(textbox(), "!");
      expect(submitButton()).toBeEnabled();
      expect(screen.queryByText(/break it down again/)).not.toBeInTheDocument();
    });

    it("ignores leading and trailing whitespace", async () => {
      const { user } = setup(false, "Fran");
      await user.type(textbox(), "  \n");
      expect(submitButton()).toBeDisabled();
    });

    it("enables submit again when the text is changed back after an edit", async () => {
      const { user } = setup(false, "Fran");
      await user.type(textbox(), "k");
      expect(submitButton()).toBeEnabled();
      await user.type(textbox(), "{Backspace}");
      expect(submitButton()).toBeDisabled();
    });
  });

  it("offers to carry on with the current workout while its text is unchanged", async () => {
    const user = userEvent.setup();
    render(
      <WodInputForm loading={false} parsedText="Fran" continueTo="/review" onSubmit={vi.fn()} />,
    );
    expect(screen.getByRole("link", { name: "Continue checking" })).toHaveAttribute(
      "href",
      "/review",
    );
    await user.type(textbox(), "!");
    expect(screen.queryByRole("link", { name: "Continue checking" })).not.toBeInTheDocument();
  });

  it("is written on the whiteboard, in handwriting", () => {
    setup();
    expect(textbox()).toHaveClass("font-kalam", "placeholder:text-purple-300");
    expect(textbox().parentElement).toHaveClass("bg-[#fdfdfb]");
  });

  it("asks for the workout, with an example, while the board is empty", () => {
    setup();
    expect(textbox()).toHaveAttribute("placeholder", BOARD_PLACEHOLDER);
    expect(BOARD_PLACEHOLDER).toMatch(/^Write your whiteboard, or paste it, here\. For example:/);
    expect(BOARD_PLACEHOLDER).toContain(EXAMPLE_WOD);
  });
});
