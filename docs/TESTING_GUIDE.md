# Testing Guide for Quirk Trade Tool

## Overview

This project uses **Vitest** for testing React components and TypeScript code. Tests are automatically run on every push to GitHub and integrated into the CI/CD pipeline.

## Test Framework

- **Test Runner:** Vitest
- **Component Testing:** @testing-library/react
- **Coverage:** @vitest/coverage-v8
- **Assertions:** @testing-library/jest-dom

## Running Tests Locally

### Frontend Tests

```bash
# Run all tests once
cd frontend
pnpm test

# Run tests in watch mode (re-run on file changes)
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests with UI interface
pnpm test:ui
```

### Orchestrator Tests

```bash
cd orchestrator
pnpm test                # Run all tests once
pnpm test:watch         # Watch mode
pnpm test:coverage      # With coverage
```

### Run All Tests (From Root)

```bash
# Test frontend
pnpm --filter frontend test

# Test orchestrator
pnpm --filter orchestrator test

# Test both
pnpm --filter frontend test && pnpm --filter orchestrator test
```

## Test Files Included

### Frontend Component Tests

1. **Hero.test.tsx** - Tests the hero section
   - Main headline rendering
   - Admin login link presence
   - Feature bullets
   - Branding elements

2. **ValuationForm.test.tsx** - Tests the valuation form
   - Form field rendering
   - VIN decoder functionality
   - Condition slider
   - Options checkboxes
   - Submit button states
   - Depreciation preview

3. **ResultsSection.test.tsx** - Tests results display
   - Base value display
   - Depreciation calculations
   - Final wholesale value
   - Condition impact table
   - Source quotes
   - PDF download link

4. **FeaturesSection.test.tsx** - Tests marketing section
   - Feature cards
   - CTA section
   - Contact link

5. **api.test.ts** - Tests API functions
   - calculateValuation()
   - getPdfReceiptUrl()
   - Error handling
   - Data formatting

### Orchestrator Tests (Already Existing)

- `auth.test.ts` - Authentication tests
- `routes/valuations.test.ts` - Valuation API routes
- `services/valuation-service.test.ts` - Valuation business logic
- `services/depreciation-calculator.test.ts` - Depreciation calculations
- `components/ValuationForm.test.tsx` - Form validation

## Test Coverage

After running `pnpm test:coverage`, view the coverage report:

```bash
# Open coverage report in browser
open frontend/coverage/index.html
```

## GitHub Actions Integration

Tests run automatically on:
- Every push to `main` branch
- Every pull request to `main` branch

### CI/CD Pipeline

1. **Test Job** - Runs first
   - Installs dependencies
   - Runs frontend tests
   - Runs orchestrator tests
   - Generates coverage report
   - Uploads coverage artifact

2. **Build Job** - Runs after tests pass
   - Builds the application
   - Creates deployment artifact

3. **Deploy Job** - Runs after build (main branch only)
   - Deploys to GitHub Pages

## Viewing Test Results

### In GitHub

1. Go to your repository
2. Click "Actions" tab
3. Click on any workflow run
4. View test results in the "test" job
5. Download coverage report from "Artifacts"

### Locally

Test results appear in your terminal with:
- ✓ Passed tests in green
- ✗ Failed tests in red
- Test duration
- Coverage percentages

## Writing New Tests

### Test File Location

Place test files next to the code they test:
```
frontend/app/components/
├── Hero.tsx
├── Hero.test.tsx
├── ValuationForm.tsx
└── ValuationForm.test.tsx
```

### Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<YourComponent />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(screen.getByText('Updated Text')).toBeInTheDocument();
  });
});
```

### Common Testing Patterns

**Testing Form Inputs:**
```typescript
const input = screen.getByLabelText('Year *');
await user.type(input, '2020');
expect(input).toHaveValue('2020');
```

**Testing Buttons:**
```typescript
const button = screen.getByRole('button', { name: /submit/i });
await user.click(button);
expect(button).toBeDisabled();
```

**Testing Links:**
```typescript
const link = screen.getByRole('link', { name: /admin login/i });
expect(link).toHaveAttribute('href', '/login');
```

**Testing API Calls:**
```typescript
vi.mock('../lib/api', () => ({
  calculateValuation: vi.fn()
}));

it('calls API when form submitted', async () => {
  const mockCalculate = vi.fn();
  // ... test implementation
  expect(mockCalculate).toHaveBeenCalledWith(expectedData);
});
```

## Best Practices

1. **Test User Behavior** - Test what users see and do, not implementation details
2. **Use Accessible Queries** - Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Keep Tests Simple** - One assertion per test when possible
4. **Mock External Dependencies** - Mock API calls, external services
5. **Test Edge Cases** - Empty states, errors, loading states
6. **Descriptive Names** - Test names should describe expected behavior

## Troubleshooting

### Tests Failing Locally

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Clear test cache
pnpm test --clearCache
```

### Tests Pass Locally but Fail in CI

- Check Node version matches (should be 20)
- Ensure all dependencies are in `package.json`
- Check environment variables

### Coverage Too Low

Aim for:
- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Lines:** 80%+

Focus testing on:
- Critical business logic
- User-facing components
- API integrations
- Form validation

## Setup Checklist

To add testing to your repository:

- [ ] Update `frontend/package.json` with test scripts and dependencies
- [ ] Copy test files to `frontend/app/components/`
- [ ] Copy test files to `frontend/app/lib/`
- [ ] Update `.github/workflows/pages.yml` with test job
- [ ] Run `pnpm install` to install test dependencies
- [ ] Run `pnpm test` to verify tests work
- [ ] Commit and push changes
- [ ] Verify tests run in GitHub Actions

## Next Steps

1. **Add More Tests** - Cover remaining components
2. **Integration Tests** - Test component interactions
3. **E2E Tests** - Consider Playwright for full user flows
4. **Performance Tests** - Monitor component render times
5. **Visual Regression** - Consider screenshot testing

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Questions?** Review test files in `/frontend/app/components/*.test.tsx` for examples.
