// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "./HomePage";
import { WodProvider } from "@/providers/WodProvider";
import { WOD_STORAGE_KEY } from "@/stores/wodStore";
import type { SavedWod } from "@/types/wod";
import type { Wod } from "@/schemas/wod";
import { fran, franPart, strengthAndMetcon } from "@/test/fixtures";
import { parseEvents, streamResponse } from "@/test/parseStream";
import type { ParseEvent } from "@/types/parse";
import { toWodState } from "@/utils/toWodState";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const fetchMock = vi.fn();

/** A streamed parse of `wod`, or a JSON error with a status. */
function respond(status: number, body: { wod?: Wod; error?: string }) {
  fetchMock.mockImplementation(async () =>
    body.wod ? streamResponse(parseEvents(body.wod)) : Response.json(body, { status }),
  );
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

  it("shows the parts as they're found, ticking each off as it's read", async () => {
    const encoder = new TextEncoder();
    let push: (event: ParseEvent) => void = () => {};
    let end: () => void = () => {};
    fetchMock.mockImplementation(async () => {
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          push = (event) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
          end = () => controller.close();
        },
      });
      return new Response(body);
    });
    await submit("A) squats B) Fran");
    expect(await screen.findByText("Reading your workout")).toBeInTheDocument();

    const [outline, a, b, cooldown, done] = parseEvents(strengthAndMetcon);
    await act(async () => push(outline));
    expect(await screen.findByText("3 parts found")).toBeInTheDocument();
    expect(screen.getByText("Fran")).toBeInTheDocument();

    await act(async () => push(b));
    await act(async () => {
      push(a);
      push(cooldown);
      push(done);
      end();
    });
    expect(await screen.findByRole("region", { name: "Fran" })).toBeInTheDocument();
    expect(screen.queryByText("3 parts found")).not.toBeInTheDocument();
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

  it("disables Break it down until the workout is edited", async () => {
    respond(200, { wod: fran });
    const user = await submit("Fran");
    await screen.findByRole("heading", { name: "Fran" });
    const button = screen.getByRole("button", { name: "Break it down" });
    expect(button).toBeDisabled();

    await user.type(screen.getByRole("textbox", { name: "Workout" }), " and Grace");
    expect(button).toBeEnabled();
  });

  it("keeps Break it down enabled after a failed parse, so it can be retried", async () => {
    respond(500, { error: "Something broke." });
    await submit("Fran");
    await screen.findByText("Something broke.");
    expect(screen.getByRole("button", { name: "Break it down" })).toBeEnabled();
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

  it("saves the parsed workout and its edits, so a refresh restores them", async () => {
    respond(200, { wod: fran });
    const user = await submit("Fran");
    await user.click(await screen.findByRole("button", { name: "Remove Thruster" }));
    await user.click(screen.getByRole("button", { name: "Edit stimulus" }));
    await user.type(screen.getByRole("textbox", { name: "Stimulus" }), " Go!");

    const saved: SavedWod = JSON.parse(sessionStorage.getItem(WOD_STORAGE_KEY)!);
    expect(saved.text).toBe("Fran");
    expect(saved.wod.parts[0].movements.map((m) => m.name)).toEqual(["Pull-up"]);
    expect(saved.wod.parts[0].stimulus.description).toBe(`${franPart.stimulus.description} Go!`);

    cleanup();
    render(
      <WodProvider>
        <HomePage />
      </WodProvider>,
    );
    expect(screen.getByRole("textbox", { name: "Workout" })).toHaveValue("Fran");
    expect(screen.getByRole("button", { name: "Break it down" })).toBeDisabled();
    expect(screen.getByRole("heading", { name: "Fran" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText(`${franPart.stimulus.description} Go!`)).toBeInTheDocument();
  });

  it("fills the text box with the saved text after hydrating a server render", async () => {
    sessionStorage.setItem(
      WOD_STORAGE_KEY,
      JSON.stringify({ text: "Fran", wod: toWodState(fran) }),
    );
    const page = (
      <WodProvider>
        <HomePage />
      </WodProvider>
    );
    const container = document.createElement("div");
    container.innerHTML = renderToString(page);
    document.body.append(container);
    expect(container.querySelector("textarea")).toHaveValue("");

    const root = await act(async () => hydrateRoot(container, page));
    expect(screen.getByRole("textbox", { name: "Workout" })).toHaveValue("Fran");
    expect(screen.getByRole("heading", { name: "Fran" })).toBeInTheDocument();
    act(() => root.unmount());
    container.remove();
  });

  it("clears the saved workout when a new parse fails", async () => {
    respond(200, { wod: fran });
    const user = await submit("Fran");
    await screen.findByRole("heading", { name: "Fran" });
    respond(422, { error: "Couldn't read that as a workout." });
    await user.type(screen.getByRole("textbox", { name: "Workout" }), "!");
    await user.click(screen.getByRole("button", { name: "Break it down" }));

    await screen.findByRole("alert");
    expect(sessionStorage.getItem(WOD_STORAGE_KEY)).toBeNull();
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
