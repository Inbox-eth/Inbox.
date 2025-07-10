/// <reference types="vitest" />
// ENSRegistration Vitest test suite
import React from "react";
import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "../test-utils";
import "@testing-library/jest-dom/vitest";
import { ENSRegistration } from "../src/components/App/ENSRegistration";
import { within } from "@testing-library/react";

const address = "0x1234567890abcdef";
const ensDomain = "inbox.eth";

// Set up env
beforeAll(() => {
  Object.defineProperty(import.meta, 'env', {
    value: { VITE_ENS_DOMAIN: ensDomain },
    writable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("ENSRegistration", () => {
  it("renders input and register button", () => {
    render(<ENSRegistration address={address} />);
    expect(screen.getByLabelText(/ENS Subname/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Register ENS/i })).toBeInTheDocument();
  });

  it("checks availability live and shows available state", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      if (url.toString().includes("/api/namestone?name=alice")) {
        return { json: async () => [], ok: true };
      }
      return { json: async () => [], ok: true };
    }));
    render(<ENSRegistration address={address} />);
    fireEvent.change(screen.getByLabelText(/ENS Subname/i), { target: { value: "alice" } });
    await waitFor(() => expect(screen.getByText(/ENS name is available/i)).toBeInTheDocument());
  });

  it("shows taken state if name is not available", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      if (url.toString().includes("/api/namestone?name=taken")) {
        return { json: async () => [{ name: "taken", domain: ensDomain }], ok: true };
      }
      return { json: async () => [], ok: true };
    }));
    render(<ENSRegistration address={address} />);
    fireEvent.change(screen.getByLabelText(/ENS Subname/i), { target: { value: "taken" } });
    await waitFor(() => {
      expect(screen.getAllByText(/already taken/i).length).toBeGreaterThan(0);
    });
  });

  it("registers a new name and shows success", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url, opts) => {
      if (typeof url === 'string' && url.includes("/api/namestone?name=alice")) {
        return { json: async () => [], ok: true };
      }
      if (typeof url === 'string' && url.includes("/api/namestone") && opts?.method === "POST") {
        return { json: async () => ({ success: true }), ok: true };
      }
      return { json: async () => [], ok: true };
    }));
    render(<ENSRegistration address={address} />);
    fireEvent.change(screen.getByLabelText(/ENS Subname/i), { target: { value: "alice" } });
    await waitFor(() => expect(screen.getByText(/ENS name is available/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Register ENS/i }));
    await waitFor(() => {
      const alert = screen.getByText(/Successfully registered and selected/i).closest('[role="alert"]');
      expect(alert).toBeInTheDocument();
      expect(within(alert as HTMLElement).getByText(/alice\.inbox\.eth/i)).toBeInTheDocument();
    });
  });

  it("displays existing names and allows selection", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      if (url.toString().includes("/api/namestone?address=")) {
        return { json: async () => [
          { name: "bob", domain: ensDomain },
          { name: "carol", domain: ensDomain },
        ], ok: true };
      }
      return { json: async () => [], ok: true };
    }));
    render(<ENSRegistration address={address} />);
    await waitFor(() =>
      expect(
        screen.getByText((content, element) =>
          /bob\.inbox\.eth/.test(content)
        )
      ).toBeInTheDocument()
    );
    fireEvent.click(screen.getByLabelText("bob.inbox.eth"));
    expect(screen.getByText(/Selected ENS/i)).toBeInTheDocument();
  });

  it("shows error for invalid name and disables register button", async () => {
    render(<ENSRegistration address={address} />);
    const input = screen.getByLabelText(/ENS Subname/i);
    fireEvent.change(input, { target: { value: "invalid name" } }); // contains space
    expect(await screen.findByText(/Invalid ENS subname/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Register ENS/i })).toBeDisabled();
    fireEvent.change(input, { target: { value: "invalid.name" } }); // contains dot
    expect(await screen.findByText(/Invalid ENS subname/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Register ENS/i })).toBeDisabled();
  });

  it("accepts and registers a name with emoji", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url, opts) => {
      if (typeof url === 'string' && url.includes("/api/namestone?name=alice👀")) {
        return { json: async () => [], ok: true };
      }
      if (typeof url === 'string' && url.includes("/api/namestone") && opts?.method === "POST") {
        return { json: async () => ({ success: true }), ok: true };
      }
      return { json: async () => [], ok: true };
    }));
    render(<ENSRegistration address={address} />);
    const input = screen.getByLabelText(/ENS Subname/i);
    fireEvent.change(input, { target: { value: "alice👀" } });
    await waitFor(() => expect(screen.getByText(/ENS name is available/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Register ENS/i }));
    await waitFor(() => {
      expect(screen.getByText(/Successfully registered and selected/i)).toBeInTheDocument();
      expect(screen.getAllByText(/alice👀\.inbox\.eth/).length).toBeGreaterThan(0);
    });
  });

  it("clears input after successful registration", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url, opts) => {
      if (typeof url === 'string' && url.includes("/api/namestone?name=alice")) {
        return { json: async () => [], ok: true };
      }
      if (typeof url === 'string' && url.includes("/api/namestone") && opts?.method === "POST") {
        return { json: async () => ({ success: true }), ok: true };
      }
      return { json: async () => [], ok: true };
    }));
    render(<ENSRegistration address={address} />);
    const input = screen.getByLabelText(/ENS Subname/i);
    fireEvent.change(input, { target: { value: "alice" } });
    await waitFor(() => expect(screen.getByText(/ENS name is available/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: /Register ENS/i }));
    await waitFor(() => {
      expect(screen.getByText(/Successfully registered and selected/i)).toBeInTheDocument();
    });
    // Click 'Register new name' to show the input again
    fireEvent.click(screen.getByRole("button", { name: /Register new name/i }));
    const inputAfter = screen.getByLabelText(/ENS Subname/i);
    expect(inputAfter).toHaveValue("");
  });

  it("disables register button for empty input", () => {
    render(<ENSRegistration address={address} />);
    const button = screen.getByRole("button", { name: /Register ENS/i });
    expect(button).toBeDisabled();
  });

  it("shows error if network request fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Network error"); }));
    render(<ENSRegistration address={address} />);
    fireEvent.change(screen.getByLabelText(/ENS Subname/i), { target: { value: "alice" } });
    await waitFor(() => {
      expect(
        screen.getByText((text) =>
          /Network error|Error checking ENS name availability/i.test(text)
        )
      ).toBeInTheDocument();
    });
  });
}); 