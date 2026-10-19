// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StimulusCard } from "./StimulusCard";
import { useUndoableText } from "@/hooks/useUndoableText";
import { franPart } from "@/test/fixtures";

function Harness({ description = franPart.stimulus.description }: { description?: string }) {
  const stimulus = useUndoableText(description);
  const [intensity, setIntensity] = useState(franPart.stimulus.intensity);
  return (
    <StimulusCard
      original={description}
      intensity={intensity}
      originalIntensity={franPart.stimulus.intensity}
      onIntensityChange={setIntensity}
      stimulus={stimulus}
    />
  );
}

const stimulusBox = () => screen.getByRole("textbox", { name: "Stimulus" });
const queryStimulusBox = () => screen.queryByRole("textbox", { name: "Stimulus" });
const button = (name: string) => screen.getByRole("button", { name });
const revert = () => button("Revert stimulus to original");

function setup() {
  render(<Harness />);
  return userEvent.setup();
}

async function editTo(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(button("Edit stimulus"));
  await user.clear(stimulusBox());
  await user.type(stimulusBox(), text);
}

describe("StimulusCard", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("shows the intensity as a gauge, also while editing", async () => {
    const user = setup();
    expect(screen.getByRole("meter", { name: "Intensity" })).toHaveAttribute("aria-valuenow", "9");
    await user.click(button("Edit stimulus"));
    expect(screen.getByRole("meter", { name: "Intensity" })).toBeInTheDocument();
  });

  it("shows the stimulus read-only until Edit is clicked", async () => {
    const user = setup();
    expect(screen.getByText(franPart.stimulus.description)).toBeInTheDocument();
    expect(queryStimulusBox()).not.toBeInTheDocument();

    await user.click(button("Edit stimulus"));
    expect(stimulusBox()).toHaveValue(franPart.stimulus.description);
    expect(stimulusBox()).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Edit stimulus" })).not.toBeInTheDocument();
  });

  it("saves edits with Done and marks the stimulus as edited", async () => {
    const user = setup();
    expect(screen.queryByText("edited")).not.toBeInTheDocument();

    await editTo(user, "Heavy and slow.");
    await user.click(button("Done"));

    expect(queryStimulusBox()).not.toBeInTheDocument();
    expect(screen.getByText("Heavy and slow.")).toBeInTheDocument();
    expect(screen.getByText("edited")).toBeInTheDocument();
  });

  it("discards the current edit on Cancel", async () => {
    const user = setup();
    await editTo(user, "Heavy and slow.");
    await user.click(button("Done"));

    await editTo(user, "Something else.");
    await user.click(button("Cancel"));
    expect(screen.getByText("Heavy and slow.")).toBeInTheDocument();
  });

  it("is required", async () => {
    const user = setup();
    await user.click(button("Edit stimulus"));
    expect(screen.queryByText("Stimulus is required.")).not.toBeInTheDocument();

    await user.clear(stimulusBox());
    expect(stimulusBox()).toBeRequired();
    expect(stimulusBox()).toHaveAttribute("aria-invalid", "true");
    expect(stimulusBox()).toHaveAccessibleDescription("Stimulus is required.");
    expect(button("Done")).toBeDisabled();

    await user.type(stimulusBox(), "   ");
    expect(button("Done")).toBeDisabled();

    await user.type(stimulusBox(), "Fast.");
    expect(button("Done")).toBeEnabled();
  });

  it("reverts to the original", async () => {
    const user = setup();
    expect(screen.queryByRole("button", { name: /Revert/ })).not.toBeInTheDocument();

    await editTo(user, "Heavy and slow.");
    await user.click(button("Done"));
    await user.click(revert());

    expect(screen.getByText(franPart.stimulus.description)).toBeInTheDocument();
    expect(screen.queryByText("edited")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Revert/ })).not.toBeInTheDocument();
  });

  it("keeps Revert with the other action buttons", async () => {
    const user = setup();
    await editTo(user, "Heavy and slow.");

    const editingActions = screen.getByRole("group", { name: "Stimulus actions" });
    expect(within(editingActions).getByRole("button", { name: "Done" })).toBeInTheDocument();
    expect(within(editingActions).getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(within(editingActions).getByRole("button", { name: /Revert/ })).toBeInTheDocument();

    await user.click(button("Done"));
    const viewActions = screen.getByRole("group", { name: "Stimulus actions" });
    expect(within(viewActions).getByRole("button", { name: "Edit stimulus" })).toBeInTheDocument();
    expect(within(viewActions).getByRole("button", { name: /Revert/ })).toBeInTheDocument();
  });

  it("undoes and redoes edits with keyboard shortcuts", async () => {
    const user = setup();
    await editTo(user, "Heavy and slow.");

    await user.keyboard("{Control>}z{/Control}");
    expect(stimulusBox()).toHaveValue(franPart.stimulus.description);

    await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");
    expect(stimulusBox()).toHaveValue("Heavy and slow.");
  });

  it("can undo a revert", async () => {
    const user = setup();
    await editTo(user, "Heavy and slow.");
    await user.click(button("Done"));
    await user.click(revert());

    await user.click(button("Edit stimulus"));
    await user.keyboard("{Control>}z{/Control}");
    expect(stimulusBox()).toHaveValue("Heavy and slow.");
  });

  it("grows to fit its content while editing", async () => {
    vi.spyOn(HTMLTextAreaElement.prototype, "scrollHeight", "get").mockImplementation(function (
      this: HTMLTextAreaElement,
    ) {
      return this.value.split("\n").length * 20;
    });
    const user = setup();
    await user.click(button("Edit stimulus"));
    expect(stimulusBox().style.height).toBe("20px");

    await user.type(stimulusBox(), "{Enter}Line two{Enter}Line three");
    expect(stimulusBox().style.height).toBe("60px");
  });

  describe("intensity", () => {
    const field = () => screen.getByRole("spinbutton", { name: "Intensity" });
    const gauge = () => screen.getByRole("meter", { name: "Intensity" });

    it("is a 1-10 field beside the gauge while editing", async () => {
      const user = setup();
      expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
      await user.click(button("Edit stimulus"));
      expect(field()).toHaveValue(9);
      expect(field()).toHaveAttribute("min", "1");
      expect(field()).toHaveAttribute("max", "10");
      expect(field()).toHaveAttribute("step", "1");
    });

    it("moves the gauge as it's changed, and counts as an edit", async () => {
      const user = setup();
      await user.click(button("Edit stimulus"));
      await user.clear(field());
      await user.type(field(), "6");
      expect(gauge()).toHaveAttribute("aria-valuenow", "6");
      await user.click(button("Done"));
      expect(screen.getByText("edited")).toBeInTheDocument();
    });

    it("only takes a whole number from 1 to 10", async () => {
      const user = setup();
      await user.click(button("Edit stimulus"));
      for (const typed of ["11", "0", "2.5"]) {
        await user.clear(field());
        await user.type(field(), typed);
        expect(screen.getByText("Use a whole number from 1 to 10.")).toBeInTheDocument();
        expect(button("Done")).toBeDisabled();
        // The gauge keeps the last whole number from 1 to 10 typed on the way.
        expect(["11", "0", "2.5"]).not.toContain(gauge().getAttribute("aria-valuenow"));
      }
      await user.clear(field());
      await user.type(field(), "10");
      expect(button("Done")).toBeEnabled();
      expect(gauge()).toHaveAttribute("aria-valuenow", "10");
    });

    it("goes back to how it was on Cancel, and to the parsed one on Revert", async () => {
      const user = setup();
      await user.click(button("Edit stimulus"));
      await user.clear(field());
      await user.type(field(), "4");
      await user.click(button("Cancel"));
      expect(gauge()).toHaveAttribute("aria-valuenow", "9");

      await user.click(button("Edit stimulus"));
      await user.clear(field());
      await user.type(field(), "4");
      await user.click(button("Done"));
      await user.click(revert());
      expect(gauge()).toHaveAttribute("aria-valuenow", "9");
      expect(screen.queryByText("edited")).not.toBeInTheDocument();
    });

    it("asks which is right when the words and the number clearly disagree", async () => {
      render(<Harness description="Super hard, all-out sprint." />);
      const user = userEvent.setup();
      expect(screen.queryByText(/Which is right/)).not.toBeInTheDocument();
      await user.click(button("Edit stimulus"));
      await user.clear(field());
      await user.type(field(), "1");
      expect(
        screen.getByText(
          /This stimulus sounds hard, but its intensity is 1 \(easy\)\. Which is right\?/,
        ),
      ).toBeInTheDocument();
      // A hint, not a block.
      expect(button("Done")).toBeEnabled();
    });
  });
});
