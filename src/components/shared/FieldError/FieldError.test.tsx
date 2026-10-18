// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FieldError } from "./FieldError";

describe("FieldError", () => {
  afterEach(() => {
    cleanup();
  });

  it("describes the field it belongs to", () => {
    render(
      <>
        <input aria-label="Name" aria-describedby="name-error" />
        <FieldError id="name-error">Name is required.</FieldError>
      </>,
    );
    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription("Name is required.");
  });
});
