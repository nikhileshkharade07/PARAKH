import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAxiosInstance } = vi.hoisted(() => {
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    defaults: { baseURL: "http://localhost:8000/api", headers: { "Content-Type": "application/json" } },
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  };
  return { mockAxiosInstance: instance };
});

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance)
  }
}));

import { api, getStoredToken, setStoredToken, clearStoredToken } from "./api";

describe("API Service Layer", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("manages auth token in localStorage correctly", () => {
    expect(getStoredToken()).toBeNull();
    setStoredToken("test-jwt-token-12345");
    expect(getStoredToken()).toBe("test-jwt-token-12345");
    clearStoredToken();
    expect(getStoredToken()).toBeNull();
  });

  it("api instance is created with expected baseURL configuration", () => {
    expect(api).toBeDefined();
    expect(api.defaults.baseURL).toBe("http://localhost:8000/api");
  });
});
