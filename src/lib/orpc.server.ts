import "server-only";

import { headers } from "next/headers";
import { createRouterClient } from "@orpc/server";
import { router } from "@/router";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

globalThis.$client = createRouterClient(router, {
  /**
   * Provide initial context if needed.
   *
   * Because this client instance is shared across all requests,
   * only include context that's safe to reuse globally.
   * For per-request context, use middleware context or pass a function as the initial context.
   */
  context: async () => ({
    headers: await headers(), // provide headers if initial context required
  }),
});

/**
 * Server-side ORPC client. Use this in server components and API routes.
 */
export const client = globalThis.$client;

/**
 * Server-side tanstack query utils for prefetching in server components
 */
export const orpc = createTanstackQueryUtils(client);
