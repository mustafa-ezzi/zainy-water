import { ORPCError, os } from "@orpc/server";
import { User } from "@clerk/backend";
import { currentUser } from "@clerk/nextjs/server";

export const requiredAuthMiddleware = os
  .$context<{ session?: { user?: User } }>()
  .middleware(async ({ context, next }) => {
    /**
     * Why we should ?? here?
     * Because it can avoid `getSession` being called when unnecessary.
     * {@link https://orpc.unnoq.com/docs/best-practices/dedupe-middleware}
     */
    const session = context.session ?? { user: await currentUser() };

    if (!session.user?.id) {
      throw new ORPCError("UNAUTHORIZED");
    }

    return next({
      context: { user: session },
    });
  });

export const adminProcedure = os.use(requiredAuthMiddleware);
