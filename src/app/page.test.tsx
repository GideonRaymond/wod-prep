// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Home from "./page";
import { fran } from "@/test/fixtures";
import { MAX_WOD_LENGTH } from "@/lib/wod";

const fetchMock = vi.fn();

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValue({ ok: status < 400, json: async () => body });
}

async function parseFran() {
  const user = userEvent.setup();
  respond(200, { wod: fran });
  render(<Home />);
  await user.click(screen.getByRole("button", { name: "Use example" }));
  await user.click(screen.getByRole("button", { name: "Break it down" }));
  await screen.findByRole("heading", { name: "Fran" });
  return user;
}

const cards = () => screen.getAllByRole("listitem");

describe("Home", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("doesn't let the user resize text boxes", async () => {
    const user = await parseFran();
    await user.click(screen.getByRole("button", { name: "Edit stimulus" }));
    const textareas = screen.getAllByRole("textbox").filter((el) => el.tagName === "TEXTAREA");
    expect(textareas).toHaveLength(2);
    for (const textarea of textareas) expect(textarea).toHaveClass("resize-none");
  });

  it("disables submit until a workout is entered", async () => {
    const user = userEvent.setup();
    render(<Home />);
    const submit = screen.getByRole("button", { name: "Break it down" });

    expect(submit).toBeDisabled();
    await user.type(screen.getByRole("textbox"), "Fran");
    expect(submit).toBeEnabled();
  });

  it("shows a character count", async () => {
    const user = userEvent.setup();
    render(<Home />);
    expect(screen.getByText(`0 / ${MAX_WOD_LENGTH}`)).toBeInTheDocument();

    await user.type(screen.getByRole("textbox"), "Fran");
    expect(screen.getByText(`4 / ${MAX_WOD_LENGTH}`)).toBeInTheDocument();
  });

  it("limits the textarea to the max length", () => {
    render(<Home />);
    expect(screen.getByRole("textbox")).toHaveAttribute("maxLength", String(MAX_WOD_LENGTH));
  });

  it("warns when the max length is reached", () => {
    render(<Home />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "x".repeat(MAX_WOD_LENGTH) },
    });

    expect(screen.getByText(/Maximum length reached/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Break it down" })).toBeEnabled();
  });

  it("disables submit when the text is over the max length", () => {
    render(<Home />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "x".repeat(MAX_WOD_LENGTH + 1) },
    });

    expect(screen.getByRole("button", { name: "Break it down" })).toBeDisabled();
  });

  it("fills in the example and hides the example button", async () => {
    const user = userEvent.setup();
    render(<Home />);
    await user.click(screen.getByRole("button", { name: "Use example" }));

    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toContain("Thrusters");
    expect(screen.queryByRole("button", { name: "Use example" })).not.toBeInTheDocument();
  });

  it("posts the workout text to the API", async () => {
    await parseFran();
    const [url, init] = fetchMock.mock.calls[0];

    expect(url).toBe("/api/parse");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body).text).toContain("21-15-9");
  });

  it("shows a loading state while parsing", async () => {
    const user = userEvent.setup();
    fetchMock.mockReturnValue(new Promise(() => {}));
    render(<Home />);
    await user.type(screen.getByRole("textbox"), "Fran");
    await user.click(screen.getByRole("button", { name: "Break it down" }));

    expect(screen.getByRole("button", { name: "Parsing…" })).toBeDisabled();
  });

  it("renders the workout summary and movement cards", async () => {
    await parseFran();

    expect(screen.getByText("For Time · 21-15-9")).toBeInTheDocument();
    expect(cards()).toHaveLength(2);
    expect(within(cards()[0]).getByRole("heading", { name: "Thruster" })).toBeInTheDocument();
    expect(within(cards()[0]).getByText("weightlifting")).toBeInTheDocument();
  });

  it("shows reps and load with icons", async () => {
    await parseFran();
    const [thruster, pullUp] = cards();

    expect(within(thruster).getByTitle("Reps")).toHaveTextContent("21-15-9");
    expect(within(thruster).getByTitle("Load")).toHaveTextContent("95/65 lb");
    expect(within(thruster).getByTitle("Load").querySelector("svg")).not.toBeNull();
    expect(within(pullUp).getByTitle("Reps")).toBeInTheDocument();
    expect(within(pullUp).queryByTitle("Load")).not.toBeInTheDocument();
  });

  it("falls back to the original text when there are no reps or load", async () => {
    const user = userEvent.setup();
    const movement = { ...fran.movements[1], reps: null, originalText: "Rest 2 min" };
    respond(200, { wod: { ...fran, movements: [movement] } });
    render(<Home />);
    await user.type(screen.getByRole("textbox"), "x");
    await user.click(screen.getByRole("button", { name: "Break it down" }));

    expect(await screen.findByText("Rest 2 min")).toBeInTheDocument();
  });

  it("shows the API error message", async () => {
    const user = userEvent.setup();
    respond(422, { error: "Couldn't read that as a workout." });
    render(<Home />);
    await user.type(screen.getByRole("textbox"), "hello");
    await user.click(screen.getByRole("button", { name: "Break it down" }));

    expect(await screen.findByText("Couldn't read that as a workout.")).toBeInTheDocument();
  });

  it("shows an error when the request fails", async () => {
    const user = userEvent.setup();
    fetchMock.mockRejectedValue(new Error("Failed to fetch"));
    render(<Home />);
    await user.type(screen.getByRole("textbox"), "Fran");
    await user.click(screen.getByRole("button", { name: "Break it down" }));

    expect(await screen.findByText("Failed to fetch")).toBeInTheDocument();
  });

  it("removes a movement", async () => {
    const user = await parseFran();
    await user.click(screen.getByRole("button", { name: "Remove Thruster" }));

    expect(cards()).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: "Thruster" })).not.toBeInTheDocument();
  });

  it("adds a movement", async () => {
    const user = await parseFran();
    await user.click(screen.getByRole("button", { name: "Add movement" }));

    const add = screen.getByRole("button", { name: "Add" });
    expect(add).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/Movement/), "Wall Balls");
    await user.type(screen.getByPlaceholderText(/Reps/), "15");
    await user.type(screen.getByPlaceholderText(/Load/), "20/14 lb");
    await user.selectOptions(screen.getByRole("combobox"), "weightlifting");
    await user.click(add);

    expect(cards()).toHaveLength(3);
    const wallBalls = cards()[2];
    expect(within(wallBalls).getByRole("heading", { name: "Wall Balls" })).toBeInTheDocument();
    expect(within(wallBalls).getByTitle("Reps")).toHaveTextContent("15");
    expect(within(wallBalls).getByTitle("Load")).toHaveTextContent("20/14 lb");
    expect(within(wallBalls).getByText("weightlifting")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add movement" })).toBeInTheDocument();
  });

  it("ignores a whitespace-only movement name", async () => {
    const user = await parseFran();
    await user.click(screen.getByRole("button", { name: "Add movement" }));
    await user.type(screen.getByPlaceholderText(/Movement/), "   ");

    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });

  it("cancels adding a movement and clears the form", async () => {
    const user = await parseFran();
    await user.click(screen.getByRole("button", { name: "Add movement" }));
    await user.type(screen.getByPlaceholderText(/Movement/), "Wall Balls");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(cards()).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Add movement" }));
    expect(screen.getByPlaceholderText(/Movement/)).toHaveValue("");
  });

  describe("stimulus", () => {
    const stimulusBox = () => screen.getByRole("textbox", { name: "Stimulus" });
    const queryStimulusBox = () => screen.queryByRole("textbox", { name: "Stimulus" });
    const button = (name: string) => screen.getByRole("button", { name });
    const revert = () => button("Revert stimulus to original");

    async function editTo(user: ReturnType<typeof userEvent.setup>, text: string) {
      await user.click(button("Edit stimulus"));
      await user.clear(stimulusBox());
      await user.type(stimulusBox(), text);
    }

    it("shows the parsed stimulus read-only until Edit is clicked", async () => {
      const user = await parseFran();
      expect(screen.getByText(fran.stimulus)).toBeInTheDocument();
      expect(queryStimulusBox()).not.toBeInTheDocument();

      await user.click(button("Edit stimulus"));
      expect(stimulusBox()).toHaveValue(fran.stimulus);
      expect(stimulusBox()).toHaveFocus();
      expect(screen.queryByRole("button", { name: "Edit stimulus" })).not.toBeInTheDocument();
    });

    it("saves edits with Done and marks the stimulus as edited", async () => {
      const user = await parseFran();
      expect(screen.queryByText("edited")).not.toBeInTheDocument();

      await editTo(user, "Heavy and slow.");
      await user.click(button("Done"));

      expect(queryStimulusBox()).not.toBeInTheDocument();
      expect(screen.getByText("Heavy and slow.")).toBeInTheDocument();
      expect(screen.getByText("edited")).toBeInTheDocument();
    });

    it("discards the current edit on Cancel", async () => {
      const user = await parseFran();
      await editTo(user, "Heavy and slow.");
      await user.click(button("Done"));

      await editTo(user, "Something else.");
      await user.click(button("Cancel"));
      expect(screen.getByText("Heavy and slow.")).toBeInTheDocument();
    });

    it("is required", async () => {
      const user = await parseFran();
      await user.click(button("Edit stimulus"));
      expect(screen.queryByText("Stimulus is required.")).not.toBeInTheDocument();

      await user.clear(stimulusBox());
      expect(stimulusBox()).toBeRequired();
      expect(stimulusBox()).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByText("Stimulus is required.")).toBeInTheDocument();
      expect(button("Done")).toBeDisabled();

      await user.type(stimulusBox(), "   ");
      expect(button("Done")).toBeDisabled();

      await user.type(stimulusBox(), "Fast.");
      expect(button("Done")).toBeEnabled();
    });

    it("reverts to the original", async () => {
      const user = await parseFran();
      expect(screen.queryByRole("button", { name: /Revert/ })).not.toBeInTheDocument();

      await editTo(user, "Heavy and slow.");
      await user.click(button("Done"));
      await user.click(revert());

      expect(screen.getByText(fran.stimulus)).toBeInTheDocument();
      expect(screen.queryByText("edited")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Revert/ })).not.toBeInTheDocument();
    });

    it("undoes and redoes edits with Ctrl+Z / Ctrl+Shift+Z", async () => {
      const user = await parseFran();
      await editTo(user, "Heavy and slow.");

      await user.keyboard("{Control>}z{/Control}");
      expect(stimulusBox()).toHaveValue(fran.stimulus);

      await user.keyboard("{Control>}{Shift>}z{/Shift}{/Control}");
      expect(stimulusBox()).toHaveValue("Heavy and slow.");
    });

    it("supports Cmd+Z and Ctrl+Y", async () => {
      const user = await parseFran();
      await editTo(user, "Heavy and slow.");

      await user.keyboard("{Meta>}z{/Meta}");
      expect(stimulusBox()).toHaveValue(fran.stimulus);

      await user.keyboard("{Control>}y{/Control}");
      expect(stimulusBox()).toHaveValue("Heavy and slow.");
    });

    it("can undo a revert", async () => {
      const user = await parseFran();
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
      const user = await parseFran();
      await user.click(button("Edit stimulus"));
      expect(stimulusBox().style.height).toBe("20px");

      await user.type(stimulusBox(), "{Enter}Line two{Enter}Line three");
      expect(stimulusBox().style.height).toBe("60px");
    });
  });
});
