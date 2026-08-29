import "@testing-library/jest-dom";

// Mock ResizeObserver for recharts / responsive containers
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
