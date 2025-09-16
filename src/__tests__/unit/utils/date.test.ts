import { describe, it, expect } from "vitest";

// Example utility functions to test
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const calculateAge = (birthDate: Date, currentDate: Date): number => {
  const age = currentDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = currentDate.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())
  ) {
    return age - 1;
  }

  return age;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

describe("Date Utils", () => {
  describe("formatDate", () => {
    it("should format date correctly", () => {
      // Use UTC to avoid timezone issues
      const date = new Date("2024-01-15T12:00:00Z");
      const result = formatDate(date);
      expect(result).toMatch(/January.*2024/);
    });

    it("should handle different dates", () => {
      // Use UTC to avoid timezone issues
      const date = new Date("2023-12-25T12:00:00Z");
      const result = formatDate(date);
      expect(result).toMatch(/December.*2023/);
    });
  });

  describe("calculateAge", () => {
    it("should calculate age correctly", () => {
      const birthDate = new Date("1990-01-01");
      const currentDate = new Date("2024-01-01");
      const result = calculateAge(birthDate, currentDate);
      expect(result).toBe(34);
    });

    it("should handle birthday not yet occurred", () => {
      const birthDate = new Date("1990-12-31");
      const currentDate = new Date("2024-01-01");
      const result = calculateAge(birthDate, currentDate);
      expect(result).toBe(33);
    });

    it("should handle same day birthday", () => {
      const birthDate = new Date("1990-01-01");
      const currentDate = new Date("2024-01-01");
      const result = calculateAge(birthDate, currentDate);
      expect(result).toBe(34);
    });
  });

  describe("validateEmail", () => {
    it("should validate correct email addresses", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name+tag@domain.co.uk")).toBe(true);
      expect(validateEmail("user@subdomain.example.com")).toBe(true);
    });

    it("should reject invalid email addresses", () => {
      expect(validateEmail("invalid-email")).toBe(false);
      expect(validateEmail("@domain.com")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("user@domain")).toBe(false);
      expect(validateEmail("")).toBe(false);
    });
  });
});
