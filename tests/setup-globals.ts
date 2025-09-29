import "@testing-library/jest-dom";

type ExportTarget = Record<string | symbol, unknown>;

declare global {
  var __vite_ssr_exportName__: (target: ExportTarget, name: string, value: unknown) => void;
}

if (typeof globalThis.__vite_ssr_exportName__ !== "function") {
  globalThis.__vite_ssr_exportName__ = (target, name, value) => {
    if (target && typeof target === "object") {
      Object.defineProperty(target, name, {
        configurable: true,
        enumerable: true,
        value,
      });
    }
  };
}
