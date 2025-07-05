import React from "react";
import { it, expect, describe, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "../test-utils";
import "@testing-library/jest-dom/vitest";
import { Connect } from "../src/components/App/Connect";
import { fireEvent } from "@testing-library/react";

// Mock usePrivy
vi.mock('@privy-io/react-auth', () => ({
  usePrivy: vi.fn(),
}));
import { usePrivy } from '@privy-io/react-auth';

afterEach(() => {
  cleanup();
});

describe("Connect", () => {
  it("should render connect button", () => {
    (usePrivy as any).mockReturnValue({ login: vi.fn(), ready: true, authenticated: false });
    render(<Connect />);
    const button = screen.getByRole("button", { name: "Connect" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent(/connect/i);
  });

  it("button is enabled when ready and not authenticated", () => {
    (usePrivy as any).mockReturnValue({ login: vi.fn(), ready: true, authenticated: false });
    render(<Connect />);
    const button = screen.getByRole("button", { name: "Connect" });
    expect(button).toBeEnabled();
  });

  it("button is disabled when not ready", () => {
    (usePrivy as any).mockReturnValue({ login: vi.fn(), ready: false, authenticated: false });
    render(<Connect />);
    const button = screen.getByRole("button", { name: "Connect" });
    expect(button).toBeDisabled();
  });

  it("button is disabled when authenticated", () => {
    (usePrivy as any).mockReturnValue({ login: vi.fn(), ready: true, authenticated: true });
    render(<Connect />);
    const button = screen.getByRole("button", { name: "Connect" });
    expect(button).toBeDisabled();
  });

  it("calls login when button is clicked", () => {
    const login = vi.fn();
    (usePrivy as any).mockReturnValue({ login, ready: true, authenticated: false });
    render(<Connect />);
    const button = screen.getByRole("button", { name: "Connect" });
    fireEvent.click(button);
    expect(login).toHaveBeenCalled();
  });

  it("does not call login when button is disabled", () => {
    const login = vi.fn();
    (usePrivy as any).mockReturnValue({ login, ready: false, authenticated: false });
    render(<Connect />);
    const button = screen.getByRole("button", { name: "Connect" });
    fireEvent.click(button);
    expect(login).not.toHaveBeenCalled();
  });
});