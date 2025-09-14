# Testing Guide

This project uses a comprehensive testing stack with Vitest for unit tests, Testing Library for component tests, and Playwright for end-to-end tests.

## Testing Stack

- **Vitest**: Unit tests and integration tests
- **Testing Library**: Component tests and user interaction tests
- **Playwright**: End-to-end tests and browser automation

## Running Tests

### Unit Tests (Vitest)

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### End-to-End Tests (Playwright)

```bash
# Run all e2e tests
pnpm e2e

# Run e2e tests with UI
pnpm e2e:ui

# Run e2e tests in headed mode (visible browser)
pnpm e2e:headed

# Run e2e tests in debug mode
pnpm e2e:debug
```

## Test Structure

```
src/
├── __tests__/
│   ├── setup.ts                 # Test setup and global mocks
│   ├── fixtures/                # Test data and mock objects
│   │   ├── auth.fixtures.ts
│   │   └── post.fixtures.ts
│   ├── unit/                    # Unit tests
│   │   ├── api/                 # API/router tests
│   │   ├── auth/                # Authentication tests
│   │   └── utils/               # Utility function tests
│   └── components/              # Component tests
│       ├── ui/                  # UI component tests
│       └── LatestPost.test.tsx
tests/
└── e2e/                         # End-to-end tests
    ├── auth.spec.ts
    ├── post-management.spec.ts
    └── navigation.spec.ts
```

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions and methods in isolation:

```typescript
// src/__tests__/unit/utils/example.test.ts
import { describe, it, expect } from "vitest";
import { formatDate } from "@/utils/date";

describe("formatDate", () => {
  it("should format date correctly", () => {
    const date = new Date("2024-01-15T12:00:00Z");
    const result = formatDate(date);
    expect(result).toMatch(/January.*2024/);
  });
});
```

### Component Tests

Component tests verify user interactions and component behavior:

```typescript
// src/__tests__/components/Example.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

const MockComponent = () => (
  <button data-testid="test-button">Click me</button>
);

describe("Example Component", () => {
  it("should render button", () => {
    render(<MockComponent />);
    expect(screen.getByTestId("test-button")).toBeInTheDocument();
  });
});
```

### E2E Tests

End-to-end tests verify complete user workflows:

```typescript
// tests/e2e/example.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Example Flow", () => {
  test("should complete user workflow", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});
```

## Test Configuration

### Vitest Configuration

- **Environment**: jsdom (for React component testing)
- **Setup**: Global test setup with mocks and utilities
- **Aliases**: Path aliases configured for imports
- **Coverage**: Built-in coverage reporting

### Playwright Configuration

- **Browsers**: Chrome, Firefox, Safari
- **Base URL**: http://localhost:3000
- **Retries**: 2 retries in CI, 0 locally
- **Web Server**: Automatically starts dev server

## Best Practices

### Unit Tests

- Test individual functions and methods
- Mock external dependencies
- Use descriptive test names
- Test edge cases and error conditions
- Keep tests fast and isolated

### Component Tests

- Test user interactions, not implementation details
- Use `data-testid` attributes for reliable element selection
- Test accessibility features
- Mock API calls and external services
- Test loading and error states

### E2E Tests

- Test critical user journeys
- Use page object model for complex pages
- Test across different browsers
- Include visual regression tests when needed
- Keep tests independent and parallelizable

## Mock Data

Test fixtures are available in `src/__tests__/fixtures/`:

```typescript
// Example usage
import { mockUser, mockSession } from "../../fixtures/auth.fixtures";
import { mockPost } from "../../fixtures/post.fixtures";
```

## Continuous Integration

Tests run automatically in CI/CD pipelines:

1. **Unit Tests**: Run on every commit
2. **Component Tests**: Run on every commit
3. **E2E Tests**: Run on pull requests and main branch

## Debugging Tests

### Unit Tests

```bash
# Run specific test file
pnpm test src/__tests__/unit/utils/date.test.ts

# Run tests with verbose output
pnpm test --reporter=verbose
```

### E2E Tests

```bash
# Debug specific test
pnpm e2e:debug tests/e2e/auth.spec.ts

# Run with browser visible
pnpm e2e:headed tests/e2e/auth.spec.ts
```

## Coverage Reports

Generate coverage reports to see test coverage:

```bash
# Generate coverage report
pnpm test:coverage

# View coverage report
open coverage/index.html
```

## Troubleshooting

### Common Issues

1. **React not defined**: Ensure React is imported in component tests
2. **Module not found**: Check path aliases in vitest.config.ts
3. **E2E timeouts**: Increase timeout or check if dev server is running
4. **Mock failures**: Verify mock setup in test files

### Getting Help

- Check test output for detailed error messages
- Use `console.log()` for debugging
- Review test setup in `src/__tests__/setup.ts`
- Consult [Vitest docs](https://vitest.dev/)
- Consult [Testing Library docs](https://testing-library.com/)
- Consult [Playwright docs](https://playwright.dev/)
