// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "./HomePage";
import { WodProvider } from "@/providers/WodProvider";
import { fran, franPart, strengthAndMetcon } from "@/test/fixtures";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const fetchMock = vi.fn();

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValue({ ok: status < 400, json: async () => body });
}

async function submit(text: string) {
  const user = userEvent.setup();
  render(
    <WodProvider>
      <HomePage />
    </WodProvider>,
  );
  await user.type(screen.getByRole("textbox", { name: "Workout" }), text);
  await user.click(screen.getByRole("button", { name: "Break it down" }));
  return user;
}

describe("HomePage", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    push.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("parses the workout and shows the summary, stimulus and movements", async () => {
    respond(200, { wod: fran });
    await submit("Fran");

    expect(await screen.findByRole("heading", { name: "Fran" })).toBeInTheDocument();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ text: "Fran" });
    expect(screen.getByText("For Time · 21-15-9")).toBeInTheDocument();
    expect(screen.getByText(franPart.stimulus.description)).toBeInTheDocument();
    const cards = screen.getAllByRole("listitem");
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByRole("heading", { name: "Thruster" })).toBeInTheDocument();
  });

  it("splits a multi-part WOD into sections", async () => {
    respond(200, { wod: strengthAndMetcon });
    await submit("A) Back squat 5x5 B) Fran C) 5 min easy row");

    expect(await screen.findByRole("region", { name: "Heavy Back Squats" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Fran" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Easy Flush" })).toBeInTheDocument();
  });

  it("shows a loading state while parsing", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    await submit("Fran");
    expect(screen.getByRole("button", { name: "Parsing…" })).toBeDisabled();
  });

  it("shows the API error message", async () => {
    respond(422, { error: "Couldn't read that as a workout." });
    await submit("hello");
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't read that as a workout.");
  });

  it("shows an error when the request fails", async () => {
    fetchMock.mockRejectedValue(new Error("Failed to fetch"));
    await submit("Fran");
    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to fetch");
  });

  it("removes a movement", async () => {
    respond(200, { wod: fran });
    const user = await submit("Fran");
    await user.click(await screen.findByRole("button", { name: "Remove Thruster" }));

    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: "Thruster" })).not.toBeInTheDocument();
  });

  it("doesn't let the user resize any text box", async () => {
    respond(200, { wod: fran });
    const user = await submit("Fran");
    await user.click(await screen.findByRole("button", { name: "Edit stimulus" }));

    const textareas = screen.getAllByRole("textbox").filter((el) => el.tagName === "TEXTAREA");
    expect(textareas).toHaveLength(2);
    for (const textarea of textareas) expect(textarea).toHaveClass("resize-none");
  });

  it("doesn't show points of performance while reviewing", async () => {
    respond(200, { wod: fran });
    await submit("Fran");
    await screen.findByRole("heading", { name: "Fran" });
    expect(screen.queryByRole("button", { name: "Points of performance" })).not.toBeInTheDocument();
  });

  it("only shows Confirm once a workout is parsed", async () => {
    respond(200, { wod: fran });
    render(
      <WodProvider>
        <HomePage />
      </WodProvider>,
    );
    expect(screen.queryByRole("button", { name: "Confirm workout" })).not.toBeInTheDocument();
  });

  it("goes to the workout page on Confirm", async () => {
    respond(200, { wod: fran });
    const user = await submit("Fran");
    await user.click(await screen.findByRole("button", { name: "Confirm workout" }));
    expect(push).toHaveBeenCalledWith("/workout");
  });

  it("can't confirm while a stimulus is empty", async () => {
    respond(200, { wod: strengthAndMetcon });
    const user = await submit("A) squats B) Fran");
    const partB = await screen.findByRole("region", { name: "Fran" });

    await user.click(within(partB).getByRole("button", { name: "Edit stimulus" }));
    await user.clear(within(partB).getByRole("textbox", { name: "Stimulus" }));

    const confirm = screen.getByRole("button", { name: "Confirm workout" });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAccessibleDescription(
      "Every part needs a stimulus before you can confirm.",
    );

    await user.type(within(partB).getByRole("textbox", { name: "Stimulus" }), "Sprint.");
    expect(confirm).toBeEnabled();
  });
});
