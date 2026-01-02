import { db } from "@/db";
import { BottleUsage } from "@/db/schema";
import { ORPCError, os } from "@orpc/server";
import { endOfDay, startOfDay, addHours } from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";
import z from "zod";
import { TIME_OFFSET } from "@/lib/utils";

export const markAsDone = os
  .input(
    z.object({
      id: z.string(),
      done: z.boolean(),
      dob: z.date().nullable(),
    })
  )
  .output(z.void())
  .handler(async ({ input }) => {
    if (!input.dob) {
      throw new ORPCError("BAD_REQUEST: DOB is not provided");
    }

    // Shift the time range by TIME_OFFSET hours to account for GMT+5 (Karachi timezone) in production
    const from = startOfDay(input.dob);
    const to = endOfDay(input.dob);

    const [bottleUsage] = await db
      .select()
      .from(BottleUsage)
      .where(
        and(
          eq(BottleUsage.moderator_id, input.id),
          gte(BottleUsage.createdAt, from),
          lte(BottleUsage.createdAt, to)
        )
      );

    if (!bottleUsage) {
      throw new ORPCError("No bottle usage found for today");
    }

    if (bottleUsage.done === input.done) {
      throw new ORPCError("Bottle usage is already in the desired state");
    }

    await db
      .update(BottleUsage)
      .set({ done: input.done })
      .where(eq(BottleUsage.id, bottleUsage.id));
  });
