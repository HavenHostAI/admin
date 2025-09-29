import { expect, test, type Page, type Route } from '@playwright/test';
import { jsonToConvex } from 'convex/values';

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
  status: string;
};

type ConvexCall = Record<string, any>;

type ConvexMocks = {
  signUpCalls: ConvexCall[];
  signInCalls: ConvexCall[];
  validateSessionCalls: ConvexCall[];
  getCurrentUser: () => AuthUser;
};

const baseUser: AuthUser = {
  id: 'user_1',
  email: 'test.user@example.com',
  name: 'Test User',
  role: 'owner',
  companyId: 'company_1',
  status: 'active',
};

const convexSuccessResponse = (value: unknown) => ({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({
    status: 'success',
    value,
    logLines: [],
  }),
});

const decodeConvexRequest = (route: Route) => {
  const bodyText = route.request().postData() ?? '{}';
  const body = JSON.parse(bodyText) as {
    path?: string;
    args?: unknown[];
  };
  const [encodedArgs] = body.args ?? [];
  const decodedArgs = encodedArgs
    ? (jsonToConvex(encodedArgs as any) as Record<string, any>)
    : {};
  return { path: body.path, args: decodedArgs };
};

const setupConvexMocks = async (
  page: Page,
  options: { user?: Partial<AuthUser> } = {},
): Promise<ConvexMocks> => {
  const signUpCalls: ConvexCall[] = [];
  const signInCalls: ConvexCall[] = [];
  const validateSessionCalls: ConvexCall[] = [];

  let activeToken: string | null = null;
  let currentUser: AuthUser = { ...baseUser, ...options.user };

  const respond = (route: Route, value: unknown) =>
    route.fulfill(convexSuccessResponse(value));

  await page.route('**/api/query_ts', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ts: Date.now().toString() }),
    }),
  );

  const handleQuery = (route: Route) => {
    const { path } = decodeConvexRequest(route);
    if (path?.startsWith('admin:')) {
      return respond(route, { data: [], total: 0 });
    }
    return respond(route, null);
  };

  await page.route('**/api/query', handleQuery);
  await page.route('**/api/query_at_ts', handleQuery);

  await page.route('**/api/mutation', (route) => respond(route, {}));

  await page.route('**/api/action', (route) => {
    const { path, args } = decodeConvexRequest(route);

    if (path === 'auth:signUp') {
      signUpCalls.push(args);
      currentUser = {
        ...currentUser,
        id: 'user_signup',
        email: args.email,
        name: args.name ?? currentUser.name,
        role: 'owner',
      };
      activeToken = 'test-signup-token';
      return respond(route, { token: activeToken, user: currentUser });
    }

    if (path === 'auth:signIn') {
      signInCalls.push(args);
      currentUser = {
        ...currentUser,
        email: args.email,
      };
      activeToken = 'test-session-token';
      return respond(route, { token: activeToken, user: currentUser });
    }

    if (path === 'auth:validateSession') {
      validateSessionCalls.push(args);
      if (!activeToken) {
        return respond(route, null);
      }
      const now = new Date();
      return respond(route, {
        session: {
          token: activeToken,
          userId: currentUser.id,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        },
        user: currentUser,
      });
    }

    return respond(route, {});
  });

  return {
    signUpCalls,
    signInCalls,
    validateSessionCalls,
    getCurrentUser: () => currentUser,
  };
};

test.describe('Authentication flows', () => {
  test('allows a new owner to sign up and sign in', async ({ page }) => {
    const mocks = await setupConvexMocks(page);

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const openSignUp = page.getByRole('button', { name: /create one/i });
    await expect(openSignUp).toBeVisible();
    await openSignUp.click();
    await expect(
      page.getByRole('heading', { level: 1, name: /create an account/i }),
    ).toBeVisible();

    const nameField = page.getByPlaceholder('Jane Doe');
    await expect(nameField).toBeVisible();
    await nameField.fill('New Owner');
    await page.getByLabel('Email').fill('New.Owner@Example.com');
    await page.getByLabel('Company Name').fill('HavenHost');
    await page.getByLabel('Password').fill('Sup3rSecret!');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(
      page.getByRole('heading', { level: 2, name: /companies/i }),
    ).toBeVisible();

    await expect.poll(() =>
      page.evaluate(() => window.localStorage.getItem('better-auth:token')),
    ).toBe('test-session-token');

    expect(mocks.signUpCalls).toHaveLength(1);
    expect(mocks.signUpCalls[0]).toMatchObject({
      email: 'new.owner@example.com',
      name: 'New Owner',
      companyName: 'HavenHost',
      password: 'Sup3rSecret!',
    });

    expect(mocks.signInCalls).toHaveLength(1);
    expect(mocks.signInCalls[0]).toMatchObject({
      email: 'new.owner@example.com',
      password: 'Sup3rSecret!',
    });

    expect(mocks.validateSessionCalls.length).toBeGreaterThan(0);
  });

  test('allows an existing user to sign in', async ({ page }) => {
    const mocks = await setupConvexMocks(page, {
      user: { id: 'user_existing', name: 'Existing Owner' },
    });

    await page.goto('/login');

    await page.getByLabel('Email').fill('OWNER@example.com  ');
    await page.getByLabel('Password').fill('owner-password!');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(
      page.getByRole('heading', { level: 2, name: /companies/i }),
    ).toBeVisible();

    await expect.poll(() =>
      page.evaluate(() => window.localStorage.getItem('better-auth:token')),
    ).toBe('test-session-token');

    expect(mocks.signUpCalls).toHaveLength(0);
    expect(mocks.signInCalls).toHaveLength(1);
    expect(mocks.signInCalls[0]).toMatchObject({
      email: 'owner@example.com',
      password: 'owner-password!',
    });

    expect(mocks.validateSessionCalls.length).toBeGreaterThan(0);
  });
});
