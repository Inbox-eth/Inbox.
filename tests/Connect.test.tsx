import React from "react";
import { it, expect, describe } from "vitest";

import "@testing-library/jest-dom/vitest";
import { render, screen } from "../test-utils";
import { Connect } from "../src/components/App/Connect";

describe("Connect", () => {

  it("should render connect button", () => {
    render(<Connect />);

    const button = screen.getByRole("button", { name: "Connect" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(/connect/i);
  });
});