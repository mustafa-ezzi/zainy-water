import type { RouterClient } from "@orpc/server";
import { RPCLink } from "@orpc/client/fetch";
import { createORPCClient } from "@orpc/client";
import { router } from "@/router";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

declare global {
  var $client: RouterClient<typeof router> | undefined;
}

const link = new RPCLink({
  url: () => {
    if (typeof window === "undefined") {
      throw new Error(
        "RPCLink is not allowed on the server side. Import from '@/lib/orpc.server' instead."
      );
    }

    return `${window.location.origin}/rpc`;
  },
});

/**
 * Client-side only ORPC client.
 * For server-side usage, import from '@/lib/orpc.server' instead.
 */
export const client: RouterClient<typeof router> =
  globalThis.$client ?? createORPCClient(link);

//just add this line and you have tanstack query integrated
export const orpc = createTanstackQueryUtils(client);
