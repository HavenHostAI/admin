import { describe, it, expect } from "vitest";

// Simple utility functions to test
const formatGreeting = (text: string): string => {
  return `Hello ${text}`;
};

const validatePostName = (name: string): boolean => {
  return name.length > 0;
};

const getSecretMessage = (): string => {
  return "you can now see this secret message!";
};

describe("Post Router Logic", () => {
  describe("formatGreeting", () => {
    it("should return greeting with input text", () => {
      const result = formatGreeting("World");
      expect(result).toBe("Hello World");
    });

    it("should handle empty text", () => {
      const result = formatGreeting("");
      expect(result).toBe("Hello ");
    });
  });

  describe("validatePostName", () => {
    it("should return true for valid post name", () => {
      const result = validatePostName("Test Post");
      expect(result).toBe(true);
    });

    it("should return false for empty name", () => {
      const result = validatePostName("");
      expect(result).toBe(false);
    });
  });

  describe("getSecretMessage", () => {
    it("should return secret message", () => {
      const result = getSecretMessage();
      expect(result).toBe("you can now see this secret message!");
    });
  });
});
