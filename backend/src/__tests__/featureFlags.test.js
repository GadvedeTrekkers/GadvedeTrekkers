import { beforeEach, describe, expect, it, vi } from "vitest";

import { isFeatureEnabled, setFeatureEnabled } from "../../../src/data/featureFlags.js";

function setWindowWithStorage(storage) {
  globalThis.window = {};

  if (storage === "throwing-getter") {
    Object.defineProperty(globalThis.window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("Storage blocked");
      },
    });
    return;
  }

  if (storage) {
    Object.defineProperty(globalThis.window, "localStorage", {
      configurable: true,
      value: storage,
    });
  }
}

describe("feature flag storage safety", () => {
  beforeEach(() => {
    delete globalThis.window;
    vi.unstubAllGlobals();
  });

  it("returns false when window is unavailable", () => {
    expect(isFeatureEnabled("backendEventReads")).toBe(false);
  });

  it("falls back to defaults when localStorage is missing", () => {
    globalThis.window = {};

    expect(isFeatureEnabled("backendEventReads")).toBe(false);
  });

  it("falls back to defaults when localStorage access throws", () => {
    setWindowWithStorage("throwing-getter");

    expect(isFeatureEnabled("backendEventReads")).toBe(false);
  });

  it("falls back to defaults when localStorage.getItem throws", () => {
    setWindowWithStorage({
      getItem() {
        throw new Error("Private mode blocked");
      },
      setItem: vi.fn(),
    });

    expect(isFeatureEnabled("backendEventReads")).toBe(false);
  });

  it("reads a stored flag value when storage is available", () => {
    setWindowWithStorage({
      getItem: vi.fn(() => "true"),
      setItem: vi.fn(),
    });

    expect(isFeatureEnabled("backendEventReads")).toBe(true);
  });

  it("swallows storage write failures", () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem() {
        throw new Error("Quota exceeded");
      },
    };
    setWindowWithStorage(storage);

    expect(() => setFeatureEnabled("backendEventReads", true)).not.toThrow();
  });
});
