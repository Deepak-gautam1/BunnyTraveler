import { vi } from "vitest";

/**
 * Creates a chainable Supabase query builder mock.
 * Each method returns `this` so calls can be chained freely.
 * `mockResolve` / `mockReject` set the final resolved value.
 */
export function createSupabaseMock(resolvedValue: unknown = { data: null, error: null }) {
  const builder: Record<string, unknown> = {};

  const chainable = [
    "select", "insert", "update", "delete", "upsert",
    "eq", "neq", "is", "in", "gt", "lt", "gte", "lte",
    "order", "limit", "maybeSingle", "single",
    "filter", "match", "or", "not",
  ];

  // All chained query methods return the builder itself
  chainable.forEach((method) => {
    builder[method] = vi.fn().mockReturnValue(builder);
  });

  // Terminal: resolves the promise
  (builder as any).then = undefined; // Prevent accidental await on builder

  // Override maybeSingle / single to resolve
  (builder as any).maybeSingle = vi.fn().mockResolvedValue(resolvedValue);
  (builder as any).single = vi.fn().mockResolvedValue(resolvedValue);

  // Make the builder itself thenable (await supabase.from(...).select(...))
  (builder as any)[Symbol.toStringTag] = "Promise";

  // Make select() return a thenable builder so `await supabase.from().select()` works
  const thenableBuilder = {
    ...builder,
    then: (resolve: (v: unknown) => void) => resolve(resolvedValue),
    catch: (_reject: (e: unknown) => void) => {},
  };

  chainable.forEach((method) => {
    (thenableBuilder as any)[method] = vi.fn().mockReturnValue(thenableBuilder);
  });

  (thenableBuilder as any).maybeSingle = vi.fn().mockResolvedValue(resolvedValue);
  (thenableBuilder as any).single = vi.fn().mockResolvedValue(resolvedValue);

  return thenableBuilder;
}

/**
 * Creates a full Supabase client mock where `.from()` returns a chainable builder.
 */
export function createSupabaseClientMock(defaultResolved: unknown = { data: [], error: null }) {
  const fromMock = vi.fn(() => createSupabaseMock(defaultResolved));

  const channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };

  return {
    from: fromMock,
    channel: vi.fn().mockReturnValue(channelMock),
    removeChannel: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };
}

/** A minimal Supabase User object for use in tests */
export const mockUser = {
  id: "user-123",
  email: "test@safarsquad.com",
  user_metadata: { full_name: "Test User" },
  app_metadata: {},
  aud: "authenticated",
  created_at: "2024-01-01T00:00:00Z",
} as any;
