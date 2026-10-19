// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomePage } from "./HomePage";
import { WodProvider } from "@/providers/WodProvider";
import { WOD_STORAGE_KEY } from "@/stores/wodStore";
import type { Wod } from "@/schemas/wod";
import { fran, strengthAndMetcon } from "@/test/fixtures";
import { parseEvents, streamResponse } from "@/test/parseStream";
import type { ParseEvent } from "@/types/parse";
import type { WodState } from "@/types/wod";
import { toWodState } from "@/utils/toWodState";

const { push, prefetch } = vi.hoisted(() => ({ push: vi.fn(), prefetch: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, prefetch }) }));

const fetchMock = vi.fn();

/** A streamed parse of `wod`, or a JSON error with a status. */
function respond(status: number, body: { wod?: Wod; error?: string }) {
  fetchMock.mockImplementation(async () =>
    body.wod ? streamResponse(parseEvents(body.wod)) : Response.json(body, { status }),
  );
}

function renderPage(saved?: { text: string; wod: WodState }) {
  if (saved) sessionStorage.setItem(WOD_STORAGE_KEY, JSON.stringify(saved));
  render(
    <WodProvider>
      <HomePage />
    </WodProvider>,
  );
  return userEvent.setup();
}

async function submit(text: string) {
  const user = renderPage();
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

  it("is the first of three steps", () => {
    renderPage();
    const progress = screen.getByRole("navigation", { name: "Progress" });
    expect(within(progress).getByText("Workout").closest("[aria-current]")).toBeInTheDocument();
    expect(within(progress).queryByRole("link")).not.toBeInTheDocument();
  });

  it("puts the text box on the board, beside the welcome and the steps ahead", () => {
    renderPage();
    expect(screen.getByRole("textbox", { name: "Workout" })).toHaveClass("font-kalam");
    expect(screen.getByRole("heading", { level: 1, name: "WOD Prep" })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "How it works" })).toBeInTheDocument();
  });

  it("writes the parts on the board as they're found, ticking each off as it's read", async () => {
    const encoder = new TextEncoder();
    let send: (event: ParseEvent) => void = () => {};
    let end: () => void = () => {};
    fetchMock.mockImplementation(async () => {
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          send = (event) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
          end = () => controller.close();
        },
      });
      return new Response(body);
    });
    await submit("A) squats B) Fran");
    expect(await screen.findByText("Reading your workout")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Breaking it down" })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "How it works" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Workout" })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Workout", hidden: true })).not.toBeVisible();
    expect(screen.getByTestId("board-writing")).toBeInTheDocument();

    const [outline, a, b, cooldown, done] = parseEvents(strengthAndMetcon);
    await act(async () => send(outline));
    expect(await screen.findByText("3 parts found")).toBeInTheDocument();
    expect(screen.getByText("B. Fran")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await act(async () => {
      send(b);
      send(a);
      send(cooldown);
      send(done);
      end();
    });
    expect(push).toHaveBeenCalledWith("/review");
    // Still the written-up board, not the text box, until the review page takes over.
    expect(screen.getByRole("heading", { level: 1, name: "Breaking it down" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Workout" })).not.toBeInTheDocument();
    expect(screen.getByText("B. Fran")).toBeInTheDocument();
  });

  it("gets the review page ready as soon as it starts reading", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    await submit("Fran");
    expect(prefetch).toHaveBeenCalledWith("/review");
    expect(push).not.toHaveBeenCalled();
  });

  it("sends the text and moves on to checking it once it's read", async () => {
    respond(200, { wod: fran });
    await submit("Fran");
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/review"));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ text: "Fran" });
    expect(JSON.parse(sessionStorage.getItem(WOD_STORAGE_KEY)!).text).toBe("Fran");
  });

  it("shows the API error message and lets it be retried", async () => {
    respond(422, { error: "Couldn't read that as a workout." });
    await submit("hello");
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't read that as a workout.");
    expect(screen.getByRole("textbox", { name: "Workout" })).toHaveValue("hello");
    expect(screen.getByRole("button", { name: "Break it down" })).toBeEnabled();
    expect(push).not.toHaveBeenCalled();
  });

  it("shows an error when the request fails", async () => {
    fetchMock.mockRejectedValue(new Error("Failed to fetch"));
    await submit("Fran");
    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to fetch");
  });

  it("starts with the current workout's text, offering to carry on checking it", async () => {
    const user = renderPage({ text: "Fran", wod: toWodState(fran) });
    expect(screen.getByRole("textbox", { name: "Workout" })).toHaveValue("Fran");
    expect(screen.getByRole("button", { name: "Break it down" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Continue checking" })).toHaveAttribute(
      "href",
      "/review",
    );
    expect(screen.getByRole("link", { name: "Check" })).toHaveAttribute("href", "/review");

    await user.type(screen.getByRole("textbox", { name: "Workout" }), " and Grace");
    expect(screen.getByRole("button", { name: "Break it down" })).toBeEnabled();
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
    act(() => root.unmount());
    container.remove();
  });

  it("clears the saved workout when a new parse fails", async () => {
    const user = renderPage({ text: "Fran", wod: toWodState(fran) });
    respond(422, { error: "Couldn't read that as a workout." });
    await user.type(screen.getByRole("textbox", { name: "Workout" }), "!");
    await user.click(screen.getByRole("button", { name: "Break it down" }));

    await screen.findByRole("alert");
    expect(sessionStorage.getItem(WOD_STORAGE_KEY)).toBeNull();
  });

  it("replaces an unedited workout without asking", async () => {
    const user = renderPage({ text: "Fran", wod: toWodState(fran) });
    respond(200, { wod: strengthAndMetcon });
    await user.type(screen.getByRole("textbox", { name: "Workout" }), "!");
    await user.click(screen.getByRole("button", { name: "Break it down" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/review"));
  });

  describe("with an edited workout", () => {
    const [part] = toWodState(fran).parts;
    const edited = { parts: [{ ...part, movements: part.movements.slice(1) }] };

    async function breakDownNew() {
      const user = renderPage({ text: "Fran", wod: edited });
      respond(200, { wod: strengthAndMetcon });
      await user.type(screen.getByRole("textbox", { name: "Workout" }), "!");
      await user.click(screen.getByRole("button", { name: "Break it down" }));
      return user;
    }

    it("asks before replacing it, and keeps it on Keep my changes", async () => {
      const user = await breakDownNew();
      const dialog = screen.getByRole("dialog", { name: "Break down the new workout?" });
      expect(dialog).toHaveTextContent("your changes are lost");

      await user.click(within(dialog).getByRole("button", { name: "Keep my changes" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
      expect(
        JSON.parse(sessionStorage.getItem(WOD_STORAGE_KEY)!).wod.parts[0].movements,
      ).toHaveLength(1);
    });

    it("breaks down the new workout once it's confirmed", async () => {
      const user = await breakDownNew();
      const dialog = screen.getByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: "Break it down" }));

      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ text: "Fran!" });
      await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/review"));
    });
  });
});
