// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Select } from "./Select";

const options = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

describe("Select", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the options and reports changes", async () => {
    const onChange = vi.fn();
    render(<Select aria-label="Pick" options={options} defaultValue="a" onChange={onChange} />);

    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Alpha", "Beta"]);
    await userEvent.selectOptions(screen.getByLabelText("Pick"), "b");
    expect(screen.getByLabelText("Pick")).toHaveValue("b");
    expect(onChange).toHaveBeenCalledOnce();
  });
});
