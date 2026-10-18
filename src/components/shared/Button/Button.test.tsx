// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pencil } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a non-submitting button by default", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "button");
  });

  it("can be a submit button", () => {
    render(<Button type="submit">Save</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("calls onClick", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("doesn't call onClick when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Save
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("renders a decorative icon", () => {
    render(<Button icon={Pencil}>Edit</Button>);
    const svg = screen.getByRole("button").querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("applies variant and size classes, letting className override them", () => {
    render(
      <Button variant="dashed" size="sm" className="py-3">
        Add
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveClass("border-dashed", "px-3", "py-3");
    expect(button).not.toHaveClass("py-1.5");
  });
});
