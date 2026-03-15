import "@testing-library/jest-dom";
import { vi } from "vitest";

// Silence console noise in tests
vi.spyOn(console, "error").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
vi.spyOn(console, "log").mockImplementation(() => {});
