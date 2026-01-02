import { db } from "@/db";
import { BottleUsage } from "@/db/schema";
import { ORPCError } from "@orpc/client";
import { os } from "@orpc/server";
import { endOfDay, startOfDay, addHours } from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";
import z from "zod";
import { TIME_OFFSET } from "@/lib/utils";

export const deleteBottleUsage = os
  .input(
    z.object({
      dob: z.date(),
      moderator_id: z.string(),
    })
  )
  .output(z.void())
  .handler(async ({ input }) => {
    // Shift the time range by TIME_OFFSET hours to account for GMT+5 (Karachi timezone) in production
    const from = startOfDay(input.dob);
    const to = endOfDay(input.dob);

    const [bottleUsage] = await db
      .select()
      .from(BottleUsage)
      .where(
        and(
          eq(BottleUsage.moderator_id, input.moderator_id),
          gte(BottleUsage.createdAt, from),
          lte(BottleUsage.createdAt, to)
        )
      );

    if (!bottleUsage) {
      throw new ORPCError("Bottle usage record not found");
    }

    await db.delete(BottleUsage).where(eq(BottleUsage.id, bottleUsage.id));
  });
