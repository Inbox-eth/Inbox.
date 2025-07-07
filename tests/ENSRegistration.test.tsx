/// <reference types="vitest" />
// ENSRegistration Vitest test suite
import React from "react";
import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "../test-utils";
import "@testing-library/jest-dom/vitest";
import { ENSRegistration } from "../src/components/App/ENSRegistration";

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
      const alerts = screen.getAllByRole('alert');
      expect(
        alerts.some(alert =>
          alert.textContent?.includes('Selected ENS:') &&
          alert.textContent?.includes('alice.inbox.eth')
        )
      ).toBe(true);
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
}); 