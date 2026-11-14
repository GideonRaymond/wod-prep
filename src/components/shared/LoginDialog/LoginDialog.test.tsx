// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createLoginStore, type LoginOutcome } from "@/stores/loginStore";
import { LoginDialog } from "./LoginDialog";

const { push, pathname } = vi.hoisted(() => ({ push: vi.fn(), pathname: { current: "/" } }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => pathname.current,
}));

const fetchMock = vi.fn();

function setup() {
  const store = createLoginStore();
  render(<LoginDialog store={store} />);
  let outcome: Promise<LoginOutcome> = Promise.resolve("cancel");
  act(() => {
    outcome = store.request("Log in to break down a new workout.");
  });
  return { store, outcome, user: userEvent.setup() };
}

describe("LoginDialog", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    push.mockReset();
    pathname.current = "/";
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("stays closed until a request needs a login", () => {
    render(<LoginDialog store={createLoginStore()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("says why, with the password focused and the example on offer", () => {
    setup();
    expect(screen.getByRole("dialog", { name: "Log in to break it down" })).toHaveTextContent(
      "Log in to break down a new workout.",
    );
    expect(screen.getByLabelText("Password")).toHaveFocus();
    expect(screen.getByText("or")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Use the example workout to test it out!" }),
    ).toBeInTheDocument();
  });

  it("logs in and lets the request carry on", async () => {
    fetchMock.mockResolvedValue(Response.json({ ok: true }));
    const { outcome, user } = setup();
    await user.type(screen.getByLabelText("Password"), "chalk{Enter}");
    await expect(outcome).resolves.toBe("in");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ password: "chalk" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a wrong password under the field and stays open", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ error: "That's not the password." }, { status: 401 }),
    );
    const { user } = setup();
    await user.type(screen.getByLabelText("Password"), "nope");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("That's not the password.")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("can't log in without a password", () => {
    setup();
    expect(screen.getByRole("button", { name: "Log in" })).toBeDisabled();
  });

  it("chooses the example instead, filling it in on the home page", async () => {
    const { store, outcome, user } = setup();
    await user.click(
      screen.getByRole("button", { name: "Use the example workout to test it out!" }),
    );
    await expect(outcome).resolves.toBe("example");
    expect(store.get().exampleWanted).toBe(true);
    expect(push).not.toHaveBeenCalled();
  });

  it("goes back to the home page for the example from another step", async () => {
    pathname.current = "/workout";
    const { user } = setup();
    await user.click(
      screen.getByRole("button", { name: "Use the example workout to test it out!" }),
    );
    expect(push).toHaveBeenCalledWith("/");
  });

  it("closes as cancelled", async () => {
    const { outcome, user } = setup();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await expect(outcome).resolves.toBe("cancel");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
