// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dialog } from "./Dialog";

function Harness({ onClose = vi.fn() }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  const close = () => {
    onClose();
    setOpen(false);
  };
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <Dialog
        open={open}
        title="Merge movements?"
        onClose={close}
        actions={
          <>
            <button onClick={close}>Cancel</button>
            <button data-autofocus>Merge</button>
          </>
        }
      >
        <p>Body text</p>
      </Dialog>
    </>
  );
}

async function openDialog(onClose = vi.fn()) {
  const user = userEvent.setup();
  render(<Harness onClose={onClose} />);
  await user.click(screen.getByRole("button", { name: "Open" }));
  return { user, onClose };
}

describe("Dialog", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing when closed", () => {
    render(<Harness />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("is a labelled modal dialog with its content and actions", async () => {
    await openDialog();
    const dialog = screen.getByRole("dialog", { name: "Merge movements?" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("Body text")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("focuses the autofocus action", async () => {
    await openDialog();
    expect(screen.getByRole("button", { name: "Merge" })).toHaveFocus();
  });

  it("closes on Escape and returns focus", async () => {
    const { user, onClose } = await openDialog();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open" })).toHaveFocus();
  });

  it("closes on a backdrop click but not on a click inside", async () => {
    const { user, onClose } = await openDialog();
    await user.click(screen.getByText("Body text"));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("dialog").parentElement!);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps Tab focus inside the dialog", async () => {
    const { user } = await openDialog();
    await user.tab();
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Merge" })).toHaveFocus();
  });
});
